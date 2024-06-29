import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { PlusIcon} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog"
import { Checkbox } from "./ui/checkbox"



const DOSAGE_TIMINGS = [
  '起床時', '朝食前', '朝食後', '昼食前', '昼食後', '夕食前', '夕食後', '就寝前',
  '発熱・疼痛時', '発熱時', '嘔気時', '頭痛時', '指示通り', '毎食前', '毎食後',
  '毎食間', '症状出現時', '12時間後'
];
// interface Set {
//   id: string;
//   name: string;
// }
const GENRES = ['解熱鎮痛', 'ピル', 'ビタミン', '対症療法', '頭痛', '抗生物質', '漢方薬', 'その他','外用薬'];

const AddDrag: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [medication, setMedication] = useState<{
    name: string;
    effects: string;
    precautions: string;
    dosageAmount: string;
    dosageTiming: string[];
    sets: string[];
    genre: string;
  }>({
    name: '',
    effects: '',
    precautions: '',
    dosageAmount: '',
    dosageTiming: [],
    sets: [],
    genre: ''
  });
  // const [isAddSetModalOpen, setIsAddSetModalOpen] = useState(false);
  // const [newSetName, setNewSetName] = useState('');

  // const { data: sets, isLoading: setsLoading } = useQuery<Set[]>({
  //   queryKey: ['sets'],
  //   queryFn: async () => {
  //     const response = await axios.get(`${import.meta.env.VITE_API_URL}/sets`);
  //     return response.data;
  //   },
  // });

  // const addSetMutation = useMutation({
  //   mutationFn: async (newSet: { name: string }) => {
  //     const response = await axios.post(`${import.meta.env.VITE_API_URL}/sets`, newSet);
  //     return response.data;
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['sets'] });
  //     toast.success('新しいセットが追加されました');
  //   },
  // });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMedication(prev => ({ ...prev, [name]: value }));
  };

  const handleGenreChange = (value: string) => {
    setMedication(prev => ({ ...prev, genre: value }));
  };

  const handleDosageTimingChange = (timing: string) => {
    setMedication(prev => ({
      ...prev,
      dosageTiming: prev.dosageTiming.includes(timing)
        ? prev.dosageTiming.filter(t => t !== timing)
        : [...prev.dosageTiming, timing]
    }));
  };

  const handleSetChange = (setId: string) => {
    setMedication(prev => {
      const newSets = prev.sets.includes(setId)
        ? prev.sets.filter(id => id !== setId)
        : [...prev.sets, setId];
      return { ...prev, sets: newSets };
    });
  };

  // const handleAddSet = async () => {
  //   if (!newSetName.trim()) {
  //     toast.error('セット名を入力してください');
  //     return;
  //   }

  //   try {
  //     await addSetMutation.mutateAsync({ name: newSetName });
  //     setNewSetName('');
  //     setIsAddSetModalOpen(false);
  //   } catch (error) {
  //     toast.error('セットの追加に失敗しました');
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medication.genre) {
      toast.error('ジャンルを選択してください');
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/medications`, medication);
      toast.success('薬剤が追加されました');
      navigate('/');
    } catch (error) {
      console.error('Error adding medication:', error);
      toast.error('薬剤の追加に失敗しました');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-10">
      <CardHeader>
        <div className='flex justify-between items-center flex-row'>
        <CardTitle >新しい薬を追加する</CardTitle>
        <Link to="/">
            <Button className='bg-blue-300 p-2 ml-4'>Home</Button>
          </Link>
        </div>
        <CardDescription>データベースに追加する新しい薬の詳細を入力してください。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="name">薬品名</Label>
          <Input
            id="name"
            name="name"
            value={medication.name}
            onChange={handleInputChange}
            placeholder="薬品名を入力してください"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="effects">効能</Label>
          <Textarea
            id="effects"
            name="effects"
            value={medication.effects}
            onChange={handleInputChange}
            placeholder="薬の有効性について情報を提供してください"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="precautions">注意事項</Label>
          <Textarea
            id="precautions"
            name="precautions"
            value={medication.precautions}
            onChange={handleInputChange}
            placeholder="薬に関する警告や注意事項を記載してください"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dosageAmount">用量</Label>
          <Input
            id="dosageAmount"
            name="dosageAmount"
            value={medication.dosageAmount}
            onChange={handleInputChange}
            placeholder="１回量（錠数、包数）を半角数字で入力してください"
          />
        </div>
        <div className="grid gap-2">
          <Label>服用タイミング</Label>
          <div className="grid grid-cols-2 gap-2">
            {DOSAGE_TIMINGS.map((timing) => (
              <div key={timing} className="flex items-center space-x-2">
                <Checkbox
                  id={`timing-${timing}`}
                  checked={medication.dosageTiming.includes(timing)}
                  onCheckedChange={() => handleDosageTimingChange(timing)}
                />
                <Label htmlFor={`timing-${timing}`}>{timing}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="genre">ジャンル</Label>
          <Select onValueChange={handleGenreChange} value={medication.genre}>
            <SelectTrigger id="genre">
              <SelectValue placeholder="ジャンルを選択してください" />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* <div className="grid gap-2">
          <Label>セット</Label>
          {setsLoading ? (
            <div>Loading sets...</div>
          ) : (
            <div className="grid gap-2">
              {sets?.map((set) => (
                <div key={set.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`set-${set.id}`}
                    checked={medication.sets.includes(set.id)}
                    onCheckedChange={() => handleSetChange(set.id)}
                  />
                  <Label htmlFor={`set-${set.id}`}>{set.name}</Label>
                </div>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAddSetModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            新しいセットを追加
          </Button>
        </div> */}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit}>薬を追加する</Button>
      </CardFooter>

      {/* <Dialog open={isAddSetModalOpen} onOpenChange={setIsAddSetModalOpen}>
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
      </Dialog> */}
    </Card>
  );
};

export default AddDrag;