import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './component/Home';
import AddSet from './component/AddSet';
import EditSet from './component/EditSet';
import AddMedication from './component/AddMedication';
import PrescriptionPreview from './component/PrescriptionPreview';
import AddDrag from './component/AddDrag';
import EditMedication from './component/EditMedication';
import MedicationList from './component/MedicationList';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/add-set" element={<AddSet />} />
        <Route path="/edit-set/:id" element={<EditSet />} />
        <Route path="/add-medication" element={<AddMedication />} />
        <Route path="/prescription-preview" element={<PrescriptionPreview />} />
        <Route path="/add-drag" element={<AddDrag />} />
        <Route path="/edit/:id" element={<EditMedication />} />
        <Route path="/edit-medication" element={<EditMedication />} />
        <Route path="/medicationslist" element={<MedicationList />} />
      </Routes>
    </Router>
  );
};

export default App;