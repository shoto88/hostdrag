import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card, CardContent, CardHeader, CardTitle, } from "./ui/card"
import { Alert, AlertDescription } from "./ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog"
import { Loader2, Pill } from "lucide-react"
import { Link } from 'react-router-dom';



interface Medication {
  id: number;
  name: string;
}

interface Set {
  id: number;
  name: string;
  medications: Medication[];
}

const AddSet: React.FC = () => {
  const [selectedSetName, setSelectedSetName] = useState<string | null>(null);
  const [isAddSetModalOpen, setIsAddSetModalOpen] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: sets, isLoading: setsLoading, error: setsError } = useQuery<Set[]>({
    queryKey: ['sets'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/sets`);
      return response.data;
    },
  });

  const { data: selectedSet} = useQuery<Set>({
    queryKey: ['set', selectedSetName],
    queryFn: async () => {
      if (!selectedSetName) return null;
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/sets/${selectedSetName}`);
      return response.data;
    },
    enabled: !!selectedSetName,
  });

  const { data: allMedications, isLoading: medicationsLoading, error: medicationsError } = useQuery<Medication[]>({
    queryKey: ['medications'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/medications`);
      return response.data;
    },
  });

  const addMedicationToSetMutation = useMutation({
    mutationFn: async ({ setName, medicationId }: { setName: string, medicationId: number }) => {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/sets/${setName}/medications`, { medicationIds: [medicationId] });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['set', variables.setName] });
    },
  });

  const removeMedicationFromSetMutation = useMutation({
    mutationFn: async ({ setName, medicationId }: { setName: string, medicationId: number }) => {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/sets/${setName}/medications`, { 
        data: { medicationIds: [medicationId] }
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['set', variables.setName] });
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

  const handleSetClick = (setName: string) => {
    setSelectedSetName(setName);
  };

  const handleAddMedication = async (medicationId: number) => {
    if (!selectedSetName) return;

    try {
      await addMedicationToSetMutation.mutateAsync({ setName: selectedSetName, medicationId });
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('薬剤の追加に失敗しました。');
    }
  };

  const handleRemoveMedication = async (medicationId: number) => {
    if (!selectedSetName) return;

    try {
      await removeMedicationFromSetMutation.mutateAsync({ setName: selectedSetName, medicationId });
      setErrorMessage('');
    } catch (error) {
      setErrorMessage('薬剤の削除に失敗しました。');
    }
  };

  const handleAddSet = async () => {
    if (!newSetName.trim()) {
      setErrorMessage('セット名を入力してください。');
      return;
    }

    try {
      await addSetMutation.mutateAsync({ name: newSetName, medicationIds: [] });
      setErrorMessage('');
      setNewSetName('');
      setIsAddSetModalOpen(false);
    } catch (error) {
      setErrorMessage('セットの追加に失敗しました。');
    }
  };

  if (setsLoading || medicationsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (setsError || medicationsError) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertDescription>データの取得中にエラーが発生しました。</AlertDescription>
      </Alert>
    );
  }

  const unregisteredMedications = allMedications?.filter(med => 
    !selectedSet?.medications.some(setMed => setMed.id === med.id)
  ) || [];

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 lg:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-[60px] items-center border-b px-6">
            <div className="flex items-center gap-2 font-semibold">
              <Pill className="h-6 w-6" />
              <span>薬剤セット管理</span>
              <Link to="/">
          <Button className='ml-5 mr-5 bg-blue-300 p-2'>Home</Button>
        </Link>
            </div>
          </div>
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              {sets?.map((set) => (
                <button
                  key={set.id}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                    selectedSetName === set.name ? "bg-muted text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => handleSetClick(set.name)}
                >
                  <Pill className="h-4 w-4" />
                  {set.name}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-4">
            <Button onClick={() => setIsAddSetModalOpen(true)} className="w-full">
              新しいセットを追加
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6">
          <h1 className="flex-1 font-semibold text-lg md:text-2xl">{selectedSetName || "セットを選択してください"}</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          {selectedSet ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>登録済み薬剤</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSet.medications.map((med) => (
                      <div key={med.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="font-medium">{med.name}</span>
                        <Button
                          size="sm"
                          onClick={() => handleRemoveMedication(med.id)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          削除
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>未登録薬剤</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {unregisteredMedications.map((med) => (
                      <div key={med.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="font-medium">{med.name}</span>
                        <Button
                          size="sm"
                          onClick={() => handleAddMedication(med.id)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          追加
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center text-muted-foreground">
              セットを選択して、内容を表示します。
            </div>
          )}
        </main>
      </div>
      <Dialog open={isAddSetModalOpen} onOpenChange={setIsAddSetModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新しいセットを追加</DialogTitle>
            <DialogDescription>新しいセットの名前を入力してください。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="セット名"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddSet} className="bg-primary text-primary-foreground">
              セットを追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {errorMessage && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AddSet;