import React, { useState } from 'react';

import { useLocation } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import axios from 'axios';

interface Medication {
  id: number;
  name: string;
  effects: string;
  precautions: string;
  dosageAmount: string;
  dosageTiming: string[];
  genre: string;
  days: number;
  unit: string;
  image_url: string; 
}

interface SelectedMedication {
  id: number;
  days: number;
  unit?: string;
}



const PrescriptionPreview: React.FC = () => {
  const location = useLocation();
  const [patientName, setPatientName] = useState("山田 太郎");
  const datePrescribed = new Date();

  const selectedMedications: SelectedMedication[] = location.state?.selectedMedications || [];

  const medicationQueries = useQueries({
    queries: selectedMedications.map((selected) => ({
      queryKey: ['medication', selected.id],
      queryFn: async () => {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/medications/${selected.id}`);
        const medicationData = response.data;
        return { 
          ...medicationData, 
          days: selected.days,
          unit: selected.unit || '日分',
          dosageTiming: Array.isArray(medicationData.dosageTiming) 
            ? medicationData.dosageTiming 
            : JSON.parse(medicationData.dosageTiming || '[]')
        };
      },
    })),
  });
  
  const isLoading = medicationQueries.some((query) => query.isLoading);
  const isError = medicationQueries.some((query) => query.isError);
  const medications = medicationQueries
    .filter((query) => query.isSuccess)
    .map((query) => query.data as Medication);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div>読み込み中...</div>;
  }

  if (isError) {
    return <div>エラーが発生しました。再度お試しください。</div>;
  }

  const getDosageForTiming = (medication: Medication, timing: string) => {
    if (medication.genre === '外用薬') {
      return timing === '指示通り' ? '適\n量' : '';
    }

    if (['毎食間', '毎食前', '毎食後'].some(t => medication.dosageTiming.includes(t)) && ['朝', '昼', '夕'].includes(timing)) {
      return medication.dosageAmount;
    }

    const matchingTiming = medication.dosageTiming.find(t => 
      (timing === '起床後' && t === '起床時') ||
      (timing === '朝' && (t === '朝食前' || t === '朝食後')) ||
      (timing === '昼' && (t === '昼食前' || t === '昼食後')) ||
      (timing === '夕' && (t === '夕食前' || t === '夕食後')) ||
      (timing === '就寝前' && t === '就寝前') ||
      (timing === '指示通り' && ['発熱・疼痛時', '嘔気時', '頭痛時','指示通り'].includes(t))
    );

    return matchingTiming ? medication.dosageAmount : '';
  };
  const handlePatientNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPatientName(event.target.value);
  };
  const isSpecialTiming = (medication: Medication) => {
    return medication.dosageTiming.includes('症状出現時') && medication.dosageTiming.includes('12時間後');
  };

  const renderNormalTimingTable = (medication: Medication) => (
    <div className="grid grid-cols-6 grid-rows-2 gap-0.5 text-xs mt-0 h-auto relative">
      {['起床後', '朝', '昼', '夕', '就寝前', '指示通り'].map((timing, index) => (
        <div key={index} className="p-1 pt-0 text-center align-middle text-[10px] relative after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:border-r after:border-black before:content-[''] before:absolute before:top-full before:left-0 before:right-0 before:border-b before:border-black last:after:border-r-0 last:before:border-b-0">
          {timing}
        </div>
      ))}
{['起床後', '朝', '昼', '夕', '就寝前', '指示通り'].map((timing, index) => (
  <div key={index} className="p-1 pt-4 text-center align-middle whitespace-pre-line">
    {getDosageForTiming(medication, timing)}
  </div>
))}
    </div>
  );
  const getDosageUnit = (medication: Medication) => {
    if (medication.genre === '外用薬') return '';
    return medication.genre === '漢方薬' ? '包' : '錠';
  };
  const renderSpecialTimingTable = (medication: Medication) => (
    <div className="grid grid-cols-2 grid-rows-2 gap-0.5 text-xs mt-0 h-auto relative">
      {['症状出現時', '12時間後'].map((timing, index) => (
        <div key={index} className="p-1 pt-0 text-center align-middle text-[10px] relative after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:border-r after:border-black before:content-[''] before:absolute before:top-full before:left-0 before:right-0 before:border-b before:border-black last:after:border-r-0 last:before:border-b-0">
          {timing}
        </div>
      ))}
      {['症状出現時', '12時間後'].map((index) => (
        <div key={index} className="p-1 pt-4 text-center align-middle">
          {medication.dosageAmount}
        </div>
      ))}
    </div>
  );


  return (
    
    <div className="w-[210mm] h-[297mm] p-2 box-border page-break-after-always">
      <div className="mb-4 print:hidden">
        <label htmlFor="patientName" className="mr-2">患者名：</label>
        <input
          type="text"
          id="patientName"
          value={patientName}
          onChange={handlePatientNameChange}
          className="border border-gray-300 rounded px-2 py-1"
        />
        <h3 className='text-gray-500 text-sm'>(上記入力欄は印刷時には表示されません)</h3>
      </div>
      <h1 className="text-sm mb-4">{patientName}様に本日処方する薬の説明書です</h1>
        
      <table className="w-full border-collapse mb-5 rounded-sm overflow-hidden">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-1 text-center align-middle text-xs w-[18%]">名前 形 色</th>
            <th className="border border-black p-1 text-center align-middle text-xs w-[21%]">飲み方</th>
            <th className="border border-black p-1 text-center align-middle text-xs w-[8%]">用法用量</th>
            <th className="border border-black p-1 text-center align-middle text-xs w-[5%]">日数</th>
            <th className="border border-black p-1 text-center align-middle text-xs w-[23%] text-red-500">効能効果</th>
            <th className="border border-black p-1 text-center align-middle text-xs w-[25%] text-red-500">注意事項(注意が必要な方)</th>
          </tr>
        </thead>
        <tbody>
          {medications.map((medication) => (
            <tr key={medication.id}>
              <td className="border border-black p-1 text-center align-middle text-xs">
                <strong className="text-[12px]">{medication.name}</strong>
                {medication.image_url && (
                  <img 
                    src={medication.image_url} 
                    alt={medication.name} 
                    className="mt-0 w-24 h-16 p-0 object-contain mx-auto"
                  />
                )}
              </td>
              <td className="border border-black p-1 text-center align-middle text-xs">
                {isSpecialTiming(medication) ? renderSpecialTimingTable(medication) : renderNormalTimingTable(medication)}
              </td>
              <td className="border border-black p-1 text-left align-middle text-xs whitespace-pre-line">
  {medication.genre === '外用薬' ? '1回適量' : `1回 ${medication.dosageAmount}${getDosageUnit(medication)}`}<br />
  {medication.dosageTiming.join('\n')}
</td>
          <td className="border border-black p-1 text-center align-middle text-xs">
  {medication.days}{medication.unit}
</td>
              <td className="border border-black p-1 text-left align-top text-[10px]">{medication.effects}</td>
              <td className="border border-black p-1 text-left align-top text-[10px]">{medication.precautions}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mb-2.5 bg-gray-50">
        <p>調剤年月日　　　{datePrescribed.toLocaleDateString()}</p>
        <p>注意事項</p>
        <p className="text-red-500 font-bold">
          お薬を服用し発疹や痒みなど現れた場合は服用を中止し、ご相談ください。
        </p>
      </div>
      <div className="text-right">
        <p>大濠パーククリニック</p>
        <p>福岡市中央区大濠公園2-35</p>
        <p>TEL092-724-5520</p>
      </div>
      <button className="block mx-auto my-5 text-black rounded-full print:hidden" onClick={handlePrint}>
        印刷
      </button>
    </div>
  );
};

export default PrescriptionPreview;