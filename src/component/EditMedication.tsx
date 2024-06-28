import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { Loader2, Pill } from "lucide-react"
import { toast } from 'react-hot-toast';
import { Alert, AlertDescription } from "./ui/alert"
import { Link } from 'react-router-dom';



const DOSAGE_TIMINGS = [
  '起床時', '朝食前', '朝食後', '昼食前', '昼食後', '夕食前', '夕食後', '就寝前',
  '発熱・疼痛時', '発熱時', '嘔気時', '頭痛時', '指示通り', '毎食前', '毎食後',
  '毎食間', '症状出現時', '12時間後'
];

const GENRES = ['解熱鎮痛', 'ピル', 'ビタミン', '対症療法', '頭痛', '抗生物質', '漢方薬','その他'];  // 新しいジャンルを追加

interface Medication {
  id: number;
  name: string;
  effects: string;
  precautions: string;
  dosageAmount: string;
  dosageTiming: string[];
  sets: string[];
  genre: string;
}

const EditMedication: React.FC = () => {
  const [selectedMedicationId, setSelectedMedicationId] = useState<number | null>(null);
  const [medication, setMedication] = useState<Medication | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const queryClient = useQueryClient();

  const { data: medications, isLoading: medicationsLoading } = useQuery<Medication[]>({
    queryKey: ['medications'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/medications`);
      return response.data;
    },
  });

  const { data: selectedMedication } = useQuery<Medication>({
    queryKey: ['medication', selectedMedicationId],
    queryFn: async () => {
      if (!selectedMedicationId) return null;
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/medications/${selectedMedicationId}`);
      return response.data;
    },
    enabled: !!selectedMedicationId,
  });

  useEffect(() => {
    if (selectedMedication) {
      setMedication(selectedMedication);
    }
  }, [selectedMedication]);

  const updateMedicationMutation = useMutation<Medication, Error, Medication>({
    mutationFn: async (updatedMedication) => {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/medications/${updatedMedication.id}`, updatedMedication);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medication', selectedMedicationId] });
      setUpdateStatus('success');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    },
    onError: (error: any) => {
      console.error('Update failed:', error);
      setUpdateStatus('error');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMedication(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleDosageTimingChange = (timing: string) => {
    setMedication(prev => {
      if (!prev) return null;
      const newDosageTiming = prev.dosageTiming.includes(timing)
        ? prev.dosageTiming.filter(t => t !== timing)
        : [...prev.dosageTiming, timing];
      return {
        ...prev,
        dosageTiming: newDosageTiming
      };
    });
  };

  const handleGenreChange = (genre: string) => {
    setMedication(prev => prev ? { ...prev, genre } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (medication) {
      if (!GENRES.includes(medication.genre)) {
        toast.error('無効なジャンルです。有効なジャンルを選択してください。');
        return;
      }
      try {
        // 現在の選択状態のみを送信
        const updatedMedication = {
          ...medication,
          dosageTiming: medication.dosageTiming.filter(timing => DOSAGE_TIMINGS.includes(timing))
        };
        await updateMedicationMutation.mutateAsync(updatedMedication);
      } catch (error) {
        console.error('Mutation error:', error);
      }
    }
  };

  if (medicationsLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/4 border-r p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">薬剤一覧</h2>
          <Link to="/">
            <Button className='bg-blue-300 p-2'>Home</Button>
          </Link>
        </div>
        <div className="space-y-2">
          {medications?.map((med) => (
            <button
              key={med.id}
              className={`flex items-left text-left w-full p-2 rounded ${
                selectedMedicationId === med.id ? "bg-blue-100" : "hover:bg-gray-100"
              }`}
              onClick={() => setSelectedMedicationId(med.id)}
            >
              <Pill className="h-4 w-4 mr-2" />
              {med.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {selectedMedicationId && medication ? (
          <Card>
            <CardHeader>
              <CardTitle>{medication.name} の編集</CardTitle>
              <CardDescription>薬剤の詳細情報を更新してください。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">薬品名</Label>
                <Input id="name" name="name" value={medication.name} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="effects">効能</Label>
                <Textarea id="effects" name="effects" value={medication.effects} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="precautions">注意事項</Label>
                <Textarea id="precautions" name="precautions" value={medication.precautions} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="dosageAmount">用量</Label>
                <Input id="dosageAmount" name="dosageAmount" value={medication.dosageAmount} onChange={handleInputChange} />
              </div>
              <div>
      <Label>服用タイミング</Label>
      <div className="grid grid-cols-2 gap-2">
        {DOSAGE_TIMINGS.map((timing) => (
          <div key={timing} className="flex items-center space-x-2">
            <Checkbox
              id={`timing-${timing}`}
              checked={medication?.dosageTiming?.includes(timing) || false}
              onCheckedChange={() => handleDosageTimingChange(timing)}
            />
            <Label htmlFor={`timing-${timing}`}>{timing}</Label>
          </div>
        ))}
      </div>
    </div>
              <div>
                <Label>ジャンル</Label>
                <Select value={medication.genre} onValueChange={handleGenreChange}>
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
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              <Button 
                onClick={handleSubmit} 
                disabled={updateStatus === 'loading'}
              >
                {updateStatus === 'loading' ? '更新中...' : '更新'}
              </Button>
              {updateStatus === 'success' && (
                <Alert className="bg-green-100 border-green-400 text-green-700">
                  <AlertDescription>薬剤情報が正常に更新されました。</AlertDescription>
                </Alert>
              )}
              {updateStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertDescription>薬剤情報の更新に失敗しました。もう一度お試しください。</AlertDescription>
                </Alert>
              )}
            </CardFooter>
          </Card>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            左側のリストから薬剤を選択してください。
          </div>
        )}
      </div>
    </div>
  );
};

export default EditMedication;