'use client'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Alert, AlertDescription } from "./ui/alert"
import { Loader2 } from "lucide-react"

interface Medication {
  id: number;
  name: string;
}



const AddSet: React.FC = () => {
  const [setName, setSetName] = useState('');
  const [selectedMedications, setSelectedMedications] = useState<number[]>([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState('');
  
  const { data: allMedications, isLoading, error } = useQuery<Medication[]>({
    queryKey: ['medications'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/medications`);
      return response.data;
    },
  });

  const addSetMutation = useMutation({
    mutationFn: async (newSet: { name: string, medicationIds: number[] }) => {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/sets`, newSet);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sets'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (setName.trim() === '') {
      setErrorMessage('セット名を入力してください。');
      return;
    }
    if (selectedMedications.length === 0) {
      setErrorMessage('少なくとも1つの薬剤を選択してください。');
      return;
    }
    try {
      await addSetMutation.mutateAsync({ name: setName, medicationIds: selectedMedications });
      alert('セットが追加されました');
      navigate('/');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(`エラー: ${error.response.data.error}\n詳細: ${error.response.data.details || '不明'}`);
      } else {
        setErrorMessage('セットの追加に失敗しました: ネットワークエラーまたは不明なエラー');
      }
    }
  };

  const handleMedicationSelect = (medicationId: number) => {
    setSelectedMedications(prev => 
      prev.includes(medicationId)
        ? prev.filter(id => id !== medicationId)
        : [...prev, medicationId]
    );
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
  
  if (error) return (
    <Alert variant="destructive" className="max-w-md mx-auto mt-8">
      <AlertDescription>データの取得中にエラーが発生しました。</AlertDescription>
    </Alert>
  );

  return (
    <div className="container max-w-4xl mx-auto p-4 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <Card className="shadow-xl border-t-4 border-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
          <CardTitle className="text-3xl font-bold text-gray-800">新規セット追加</CardTitle>
          <CardDescription className="text-gray-600">新しい薬剤セットを作成します。セット名を入力し、含める薬剤を選択してください。</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="setName" className="block text-sm font-medium text-gray-700 mb-1">セット名</label>
              <Input
                id="setName"
                type="text"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="セット名を入力"
                className="w-full border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">薬剤選択</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto pr-2">
                {allMedications?.map((med: Medication) => (
                  <div
                    key={med.id}
                    className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                      selectedMedications.includes(med.id)
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <Checkbox
                      checked={selectedMedications.includes(med.id)}
                      onCheckedChange={() => handleMedicationSelect(med.id)}
                      id={`med-${med.id}`}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`med-${med.id}`}
                      className="text-sm text-gray-700 cursor-pointer flex-grow"
                    >
                      {med.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
              disabled={addSetMutation.isPending}
            >
              {addSetMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  セット追加中...
                </>
              ) : 'セットを追加'}
            </Button>
            {errorMessage && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddSet;