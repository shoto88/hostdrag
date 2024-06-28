'use client'
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"


const GENRES = ['解熱鎮痛', 'ピル', 'ビタミン', '対症療法', '頭痛', '抗生物質', '漢方薬','その他','外用薬'];  // 新しいジャンルを追加

interface Medication {
  id: number;
  name: string;
  genre: string;
}

const UpdateMedicationGenre: React.FC = () => {
  const [selectedMedication, setSelectedMedication] = useState<number | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: medications, isLoading: medicationsLoading } = useQuery<Medication[]>({
    queryKey: ['medications'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/medications`);
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: (updatedMedication: { id: number; genre: string }) => {
      console.log('Sending update:', updatedMedication); // デバッグ用ログ
      return axios.patch(`${import.meta.env.VITE_API_URL}/medications/${updatedMedication.id}`, { genre: updatedMedication.genre });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      alert('薬剤のジャンルが正常に更新されました。');
      setSelectedMedication(null);
      setSelectedGenre('');
    },
    onError: (error: any) => {
      if (axios.isAxiosError(error) && error.response) {
        alert(`薬剤のジャンル更新中にエラーが発生しました: ${error.response.data.error || '不明なエラー'}\n詳細: ${error.response.data.details || '不明'}`);
      } else {
        alert('薬剤のジャンル更新中にエラーが発生しました。');
      }
      console.error('Error updating medication genre:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMedication && selectedGenre) {
      console.log('Submitting:', { id: selectedMedication, genre: selectedGenre }); // デバッグ用ログ
      mutation.mutate({ id: selectedMedication, genre: selectedGenre });
    } else {
      alert('薬剤とジャンルを選択してください。');
    }
  };

  if (medicationsLoading) {
    return <div>ローディング中...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>薬剤のジャンルを更新</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="medication" className="block text-sm font-medium text-gray-700">薬剤</label>
              <Select onValueChange={(value) => setSelectedMedication(Number(value))} value={selectedMedication?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="薬剤を選択" />
                </SelectTrigger>
                <SelectContent>
                  {medications?.map((med) => (
                    <SelectItem key={med.id} value={med.id.toString()}>{med.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-gray-700">ジャンル</label>
              <Select onValueChange={setSelectedGenre} value={selectedGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="ジャンルを選択" />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">ジャンルを更新</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdateMedicationGenre;