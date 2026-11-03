import React, { useState } from 'react';
import { exportReport } from '../../services/api/analytics';

const ExportButtons = ({ moduleType, extraFilters = {}, showFormCsr1 = false }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format, isCsr1 = false) => {
    setLoading(true);
    try {
      if (isCsr1) {
        await exportReport('form-csr-1', 'pdf', extraFilters);
      } else {
        await exportReport(moduleType, format, extraFilters);
      }
    } catch (e) {
      alert('Export failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <button 
        disabled={loading}
        onClick={() => handleExport('csv')}
        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg flex items-center transition-colors"
      >
        <span className="material-symbols-outlined text-sm mr-1.5">csv</span>
        CSV
      </button>
      <button 
        disabled={loading}
        onClick={() => handleExport('excel')}
        className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-lg flex items-center transition-colors border border-green-200"
      >
        <span className="material-symbols-outlined text-sm mr-1.5">table</span>
        Excel
      </button>
      <button 
        disabled={loading}
        onClick={() => handleExport('pdf')}
        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg flex items-center transition-colors border border-red-200"
      >
        <span className="material-symbols-outlined text-sm mr-1.5">picture_as_pdf</span>
        PDF
      </button>

      {showFormCsr1 && (
        <button 
          disabled={loading}
          onClick={() => handleExport('pdf', true)}
          className="ml-4 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-lg flex items-center transition-colors border border-primary/20"
        >
          <span className="material-symbols-outlined text-sm mr-1.5">receipt_long</span>
          Form CSR-1
        </button>
      )}
    </div>
  );
};

export default ExportButtons;
