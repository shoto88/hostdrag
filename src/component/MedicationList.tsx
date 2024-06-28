import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';

interface MedicationDetails {
  id: number;
  name: string;
  effects: string;
  precautions: string;
  dosageAmount: string;
  dosageTiming: string;
  genre: string;
}

const MedicationList: React.FC = () => {
  const { data: medications, isLoading, error } = useQuery<MedicationDetails[]>({
    queryKey: ['medicationDetails'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/medications`);
      return response.data;
    },
  });

  if (isLoading) return <div className="text-center py-10">薬剤情報ローディング中...</div>;
  if (error) return <div className="text-center py-10 text-red-500">エラーが発生しました。</div>;

  return (
    <div className="container mx-auto p-4">
      <div className='flex  items-center flex-row'>
      <h1 className="text-3xl font-bold mb-0">薬剤詳細一覧</h1>
      <Link to="/">
            <Button className='bg-blue-300 p-2 ml-4'>Home</Button>
          </Link>
        </div>
      <div className="space-y-6">
        {medications?.map((medication) => (
          <div key={medication.id} className="bg-white shadow-md rounded-lg p-6 mb-4">
            <h2 className="text-2xl font-bold mb-4">{medication.name}</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">効能効果</h3>
                <p>{medication.effects}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">注意事項</h3>
                <p>{medication.precautions}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">一回量</h3>
                <p>{medication.dosageAmount}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">服薬タイミング</h3>
                <p>{medication.dosageTiming}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">ジャンル</h3>
                <p>{medication.genre}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicationList;