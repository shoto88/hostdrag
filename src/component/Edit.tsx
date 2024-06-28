import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Alert, AlertDescription } from "./ui/alert"
import { Loader2 } from "lucide-react"



const EditMedication: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    effects: '',
    precautions: '',
    dosageAmount: '',
    dosageTiming: [],
    sets: [],
    genre: ''
  });

  const { data: medication, isLoading, error } = useQuery({
    queryKey: ['medication', id],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/medications/${id}`);
      return response.data;
    },
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/genres`);
      return response.data;
    },
  });

  useEffect(() => {
    if (medication) {
      setFormData(medication);
    }
  }, [medication]);

  const updateMutation = useMutation({
    mutationFn: async (updatedMedication: typeof formData) => {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/medications/${id}`, updatedMedication);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medication', id] });
      navigate('/');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await updateMutation.mutateAsync(formData);
      alert('薬剤情報が更新されました');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setErrorMessage(`エラー: ${error.response.data.error}\n詳細: ${error.response.data.details || '不明'}`);
      } else {
        setErrorMessage('薬剤情報の更新に失敗しました: ネットワークエラーまたは不明なエラー');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenreChange = (value: string) => {
    setFormData(prev => ({ ...prev, genre: value }));
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
          <CardTitle className="text-3xl font-bold text-gray-800">薬剤情報編集</CardTitle>
          <CardDescription className="text-gray-600">薬剤の情報を編集します。</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">薬剤名</label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="effects" className="block text-sm font-medium text-gray-700 mb-1">効果</label>
              <Textarea
                id="effects"
                name="effects"
                value={formData.effects}
                onChange={handleInputChange}
                className="w-full border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label htmlFor="precautions" className="block text-sm font-medium text-gray-700 mb-1">注意事項</label>
              <Textarea
                id="precautions"
                name="precautions"
                value={formData.precautions}
                onChange={handleInputChange}
                className="w-full border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label htmlFor="dosageAmount" className="block text-sm font-medium text-gray-700 mb-1">用量</label>
              <Input
                id="dosageAmount"
                name="dosageAmount"
                value={formData.dosageAmount}
                onChange={handleInputChange}
                className="w-full border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-1">ジャンル</label>
              <Select value={formData.genre} onValueChange={handleGenreChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="ジャンルを選択" />
                </SelectTrigger>
                <SelectContent>
                  {genres?.map((genre: string) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  更新中...
                </>
              ) : '更新'}
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

export default EditMedication;