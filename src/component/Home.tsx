import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"
import { Input } from "./ui/input"
import { PillIcon } from 'lucide-react';
import { cn } from "./utils";

interface Set {
  name: string;
  medications: Medication[];
}

interface Medication {
  id: number;
  name: string;
  genre: string;
}
interface MedicationSelection {
  selected: boolean;
  days: number;
  unit?: string;
}


const GENRE_ORDER = [
  '頭痛',
  '解熱鎮痛',
  'ピル',
  '漢方薬',
  '対症療法',
  'ビタミン',
  '抗生物質',

  'その他'
];
const Home: React.FC = () => {
  const [selectedMedications, setSelectedMedications] = useState<{ [key: number]: MedicationSelection }>({});
  const [expandedSetNames, setExpandedSetNames] = useState(new Set<string>());

  const { data: sets, isLoading: setsLoading, error: setsError } = useQuery<Set[]>({
    queryKey: ['sets'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/sets`);
      const setsData = response.data;
      const setsWithMedications = await Promise.all(setsData.map(async (set: Set) => {
        const medicationsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/sets/${set.name}`);
        return { ...set, medications: medicationsResponse.data.medications };
      }));
      return setsWithMedications;
    },
  });

  const { data: allMedications } = useQuery<Medication[]>({
    queryKey: ['medications'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/medications`);
      return response.data;
    },
  });

  const medicationsByGenre = useMemo(() => {
    if (!allMedications) return {};
    return allMedications.reduce((acc, med) => {
      if (!acc[med.genre]) {
        acc[med.genre] = [];
      }
      acc[med.genre].push(med);
      return acc;
    }, {} as Record<string, Medication[]>);
  }, [allMedications]);
  
  const sortedGenres = useMemo(() => {
    return Object.keys(medicationsByGenre).sort((a, b) => {
      const indexA = GENRE_ORDER.indexOf(a);
      const indexB = GENRE_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [medicationsByGenre]);

  const handleMedicationSelect = (medicationId: number) => {
    const medication = allMedications?.find(med => med.id === medicationId);
    const unit = (medication?.name === '五苓散料' || medication?.name === '呉茱萸湯') ? '回分' : '日分';
    setSelectedMedications(prev => ({
      ...prev,
      [medicationId]: { 
        selected: !prev[medicationId]?.selected,
        days: prev[medicationId]?.days || 1,
        unit: unit
      }
    }));
  };
  

  const handleDaysChange = (medicationId: number, days: number) => {
    setSelectedMedications(prev => ({
      ...prev,
      [medicationId]: { ...prev[medicationId], days }
    }));
  };
  const toggleSetExpansion = (setName: string) => {
    setExpandedSetNames(prevNames => {
      const newNames = new Set(prevNames);
      if (newNames.has(setName)) {
        newNames.delete(setName);
      } else {
        newNames.add(setName);
      }
      return newNames;
    });
  };

  const CustomCheckbox = React.forwardRef<
    React.ElementRef<typeof Checkbox>,
    React.ComponentPropsWithoutRef<typeof Checkbox>
  >(({ className, ...props }, ref) => (
    <Checkbox
      ref={ref}
      className={cn(
        "border-blue-500 text-blue-500 focus:ring-blue-500 bg-white",
        className
      )}
      {...props}
    />
  ));

  const getSelectedMedications = () => {
    return Object.entries(selectedMedications)
      .filter(([_, value]) => value.selected)
      .map(([id, value]) => ({ id: parseInt(id), days: value.days, unit: value.unit }));
  };

  const getSelectedMedicationNames = () => {
    return Object.entries(selectedMedications)
      .filter(([_, value]) => value.selected)
      .map(([id]) => {
        const medication = allMedications?.find(med => med.id === parseInt(id));
        return medication ? medication.name : '';
      });
  };

  const genreColors = [
    'bg-red-100 border-red-200',
    'bg-blue-100 border-blue-200',
    'bg-green-100 border-green-200',
    'bg-yellow-100 border-yellow-200',
    'bg-purple-100 border-purple-200',
    'bg-pink-100 border-pink-200',
    'bg-indigo-100 border-indigo-200',
    'bg-gray-100 border-gray-200'
  ];

  if (setsLoading) return <div className="text-center py-10">セット一覧ローディング中...</div>;
  if (setsError) return <div className="text-center py-10 text-red-500">エラーが発生しました。</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col mb-6">
        <h1 className="text-3xl font-bold mb-4">薬剤管理システム</h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">選択した薬剤:</h2>
          <div className="flex flex-wrap gap-2">
            {getSelectedMedicationNames().map((name, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex">
        <div className="w-1/3 pr-4">
          <h2 className="text-2xl font-semibold mb-4">セット一覧</h2>
          <div className="space-y-2">
            {sets?.map((set) => (
              <button
                key={set.name}
                onClick={() => toggleSetExpansion(set.name)}
                className={`w-full border border-gray-200 text-left p-2 rounded ${
                  expandedSetNames.has(set.name) ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                {set.name}
              </button>
            ))}
          </div>
        </div>

        <div className="w-2/3 pl-4 border-l">
          <h2 className="text-2xl font-semibold mb-4">選択されたセット</h2>
          {Array.from(expandedSetNames).map(setName => {
            const selectedSet = sets?.find(set => set.name === setName);
            return (
              <div key={setName} className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{setName}</h3>
                <div className="space-y-3">
                  {selectedSet?.medications?.map(med => (
                    <div key={med.id} className="flex items-center space-x-3 bg-gray-50 p-2 rounded">
                      <CustomCheckbox
                        checked={selectedMedications[med.id]?.selected || false}
                        onCheckedChange={() => handleMedicationSelect(med.id)}
                        className="h-5 w-5"
                      />
                      <span className="flex-grow">{med.name}</span>
                      {selectedMedications[med.id]?.selected && (
  <div className="flex items-center space-x-2">
    <Input
      type="number"
      value={selectedMedications[med.id]?.days || 1}
      onChange={(e) => handleDaysChange(med.id, parseInt(e.target.value, 10))}
      min="1"
      className="w-16 text-right"
    />
    <span className="whitespace-nowrap">
      {selectedMedications[med.id]?.unit || '日分'}
    </span>
  </div>
)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-8 flex">
        <Link to="/add-set">
          <Button className='ml-5 mr-5 bg-blue-300 p-2'>セット追加</Button>
        </Link>
        <Link to="/add-drag">
          <Button className='ml-5 mr-5 bg-green-300 p-2'>薬剤追加</Button>
        </Link>
        <Link to="/edit-medication">
          <Button className='ml-5 mr-5 bg-yellow-300 p-2'>薬剤編集</Button>
        </Link>
        <Link to="/medicationslist">
          <Button className='ml-5 mr-5 bg-red-300 p-2'>薬剤詳細一覧</Button>
        </Link>
        <Link
  to="/prescription-preview"
  state={{ selectedMedications: getSelectedMedications() }}
>
  <Button className='ml-5 mr-5 bg-purple-300 p-2'>プレビュー</Button>
</Link>

      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">全薬剤一覧</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedGenres.map((genre, index) => (
            <div key={genre} className={`${genreColors[index % genreColors.length]} p-6 rounded-lg shadow-md border-2`}>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <PillIcon className="mr-2" />
                {genre}
              </h3>
              <div className="space-y-2">
              {medicationsByGenre[genre].map(med => (
  <div key={med.id} className="flex items-center space-x-2 bg-white bg-opacity-50 p-2 rounded">
    <CustomCheckbox
      checked={selectedMedications[med.id]?.selected || false}
      onCheckedChange={() => handleMedicationSelect(med.id)}
      className="h-5 w-5"
    />
    <span className="flex-grow">{med.name}</span>
    {selectedMedications[med.id]?.selected && (
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          value={selectedMedications[med.id]?.days || 1}
          onChange={(e) => handleDaysChange(med.id, parseInt(e.target.value, 10))}
          min="1"
          className="w-16"
        />
        <span className="whitespace-nowrap">
          {selectedMedications[med.id]?.unit || '日分'}
        </span>
      </div>
    )}
  </div>
))}
              </div>
            </div>
          ))}
        </div>
      </div>


    </div>
  );
}

export default Home;