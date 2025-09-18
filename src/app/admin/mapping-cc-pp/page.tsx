"use client";
import React, { useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { getApiPath } from '@/utils/api';
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/authenticatedFetch';

interface CCPPMapping {
  id: number;
  [key: string]: any; // Allow dynamic property access for other columns
}

interface TableSchema {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

// Separate memoized FormModal component to prevent re-renders
const FormModal = memo(({ 
  isEdit = false, 
  isOpen, 
  formData, 
  formErrors, 
  schema, 
  submitting, 
  onClose, 
  onFormChange, 
  onSubmit 
}: {
  isEdit?: boolean;
  isOpen: boolean;
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  schema: TableSchema[];
  submitting: boolean;
  onClose: () => void;
  onFormChange: (field: string, value: any) => void;
  onSubmit: () => void;
}) => {
  if (!isOpen) return null;

  // Get editable columns (exclude id and system columns)
  const getEditableColumns = () => {
    console.log('getEditableColumns called, schema:', schema);
    if (schema.length > 0) {
      const allColumns = schema.map(col => col.column_name);
      const filtered = allColumns.filter(col => 
        col !== 'id' && 
        !col.includes('created_at') && 
        !col.includes('updated_at')
      );
      console.log('Schema-based editable columns:', filtered);
      return filtered;
    }
    
    console.log('No schema available, no editable columns');
    return [];
  };

  const editableColumns = getEditableColumns();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Record' : 'Add New Record'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Debug info - always show for troubleshooting */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <h4 className="text-blue-950 dark:text-blue-100 text-sm font-medium mb-2">Form Status</h4>
            <div className="text-xs text-blue-950 dark:text-blue-200 space-y-1">
              <p>Schema length: {schema.length}</p>
              <p>Editable columns: {editableColumns.length}</p>
              <p>Schema source: {schema.length > 0 ? 'Loaded successfully' : 'Using fallback schema'}</p>
              {editableColumns.length > 0 && (
                <p>Available fields: {editableColumns.join(', ')}</p>
              )}
            </div>
          </div>
          
          {editableColumns.length === 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">
                ⚠️ Form fields are not loading. This usually means there's an issue with the schema fetch.
                Please check the console for errors or refresh the page.
              </p>
            </div>
          )}
          
          {editableColumns.map(column => {
            const schemaCol = schema.find(s => s.column_name === column);
            const isRequired = schemaCol?.is_nullable === 'NO';
            const fieldValue = formData[column] || '';
            
            return (
              <div key={`field-${column}`}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {column.replace(/_/g, ' ').toUpperCase()}
                  {isRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {schemaCol?.data_type === 'text' || column.includes('description') ? (
                  <textarea
                    value={fieldValue}
                    onChange={(e) => onFormChange(column, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder={`Enter ${column.replace(/_/g, ' ')}`}
                    autoComplete="off"
                    disabled={submitting}
                  />
                ) : (
                  <input
                    type={schemaCol?.data_type === 'integer' ? 'number' : 'text'}
                    value={fieldValue}
                    onChange={(e) => onFormChange(column, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={`Enter ${column.replace(/_/g, ' ')}`}
                    autoComplete="off"
                    disabled={submitting}
                  />
                )}
                
                {formErrors[column] && (
                  <p className="text-red-500 text-xs mt-1">{formErrors[column]}</p>
                )}
              </div>
            );
          })}
        </div>
        
        {formErrors.general && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-4">
            <p className="text-red-600 dark:text-red-400 text-sm">{formErrors.general}</p>
          </div>
        )}
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={submitting}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            type="button"
          >
            {submitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
});

FormModal.displayName = 'FormModal';

// Separate DeleteModal component
const DeleteModal = memo(({ 
  isOpen, 
  selectedRecord, 
  submitting, 
  onClose, 
  onDelete 
}: {
  isOpen: boolean;
  selectedRecord: CCPPMapping | null;
  submitting: boolean;
  onClose: () => void;
  onDelete: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Record</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete this record? This action cannot be undone.
        </p>
        
        {selectedRecord && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>ID:</strong> {selectedRecord.id}
            </p>
            {Object.entries(selectedRecord).slice(0, 3).map(([key, value]) => (
              key !== 'id' && (
                <p key={key} className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>{key.replace(/_/g, ' ')}:</strong> {value?.toString()?.substring(0, 50)}
                  {value?.toString()?.length > 50 ? '...' : ''}
                </p>
              )
            ))}
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            disabled={submitting}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            disabled={submitting}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            type="button"
          >
            {submitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteModal.displayName = 'DeleteModal';

export default function MappingCCPPPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CCPPMapping[]>([]);
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CCPPMapping | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      fetchData();
      fetchSchema();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [router]);

  const fetchData = async () => {
    try {
      setError(null);
      const response = await authenticatedGet(getApiPath('api/cc-pp-mapping'));
      const result = await response.json();
      
      if (result.success) {
        setData(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchema = async () => {
    try {
      console.log('Fetching schema from:', getApiPath('api/cc-pp-mapping?action=schema'));
      const response = await authenticatedGet(getApiPath('api/cc-pp-mapping?action=schema'));
      const result = await response.json();
      console.log('Schema response:', result);
      
      if (result.success && result.schema && result.schema.length > 0) {
        console.log('Setting schema from API:', result.schema);
        setSchema(Array.isArray(result.schema) ? result.schema : []);
      } else {
        console.log('API schema failed or empty, using fallback schema');
        // Fallback schema for CC PP mapping based on real table structure
        const fallbackSchema = [
          { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
          { column_name: 'company', data_type: 'character varying', is_nullable: 'YES', column_default: null },
          { column_name: 'company_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
          { column_name: 'daftar_isi_file_id', data_type: 'character varying', is_nullable: 'YES', column_default: null },
          { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
          { column_name: 'kategori', data_type: 'character varying', is_nullable: 'YES', column_default: null },
          { column_name: 'kategori_sub', data_type: 'character varying', is_nullable: 'YES', column_default: null },
          { column_name: 'knowledge_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
          { column_name: 'sme', data_type: 'character varying', is_nullable: 'YES', column_default: null },
          { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null },
          { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null }
        ];
        console.log('Setting fallback schema:', fallbackSchema);
        setSchema(fallbackSchema);
      }
    } catch (error) {
      console.error('Error fetching schema, using fallback:', error);
      // Fallback schema for CC PP mapping
      const fallbackSchema = [
        { column_name: 'id', data_type: 'integer', is_nullable: 'NO', column_default: null },
        { column_name: 'company', data_type: 'character varying', is_nullable: 'YES', column_default: null },
        { column_name: 'company_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
        { column_name: 'daftar_isi_file_id', data_type: 'character varying', is_nullable: 'YES', column_default: null },
        { column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
        { column_name: 'kategori', data_type: 'character varying', is_nullable: 'YES', column_default: null },
        { column_name: 'kategori_sub', data_type: 'character varying', is_nullable: 'YES', column_default: null },
        { column_name: 'knowledge_code', data_type: 'character varying', is_nullable: 'YES', column_default: null },
        { column_name: 'sme', data_type: 'character varying', is_nullable: 'YES', column_default: null },
        { column_name: 'created_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null },
        { column_name: 'updated_at', data_type: 'timestamp', is_nullable: 'YES', column_default: null }
      ];
      setSchema(fallbackSchema);
    }
  };

  // CRUD Operations
  const createRecord = useCallback(async () => {
    setSubmitting(true);
    setFormErrors({});
    
    try {
      const response = await authenticatedPost(getApiPath('api/cc-pp-mapping'), formData);
      
      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // Refresh data
        handleCloseModal();
        // Show success message (you can add a toast notification here)
      } else {
        setError(result.error || 'Failed to create record');
      }
    } catch (error) {
      console.error('Error creating record:', error);
      setError(error instanceof Error ? error.message : 'Failed to create record');
    } finally {
      setSubmitting(false);
    }
  }, [formData]);

  const updateRecord = useCallback(async () => {
    if (!selectedRecord) return;
    
    setSubmitting(true);
    setFormErrors({});
    
    try {
      const response = await authenticatedPut(getApiPath('api/cc-pp-mapping'), { id: selectedRecord.id, ...formData });
      
      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // Refresh data
        handleCloseModal();
      } else {
        setError(result.error || 'Failed to update record');
      }
    } catch (error) {
      console.error('Error updating record:', error);
      setError(error instanceof Error ? error.message : 'Failed to update record');
    } finally {
      setSubmitting(false);
    }
  }, [selectedRecord, formData]);

  const deleteRecord = useCallback(async () => {
    if (!selectedRecord) return;
    
    setSubmitting(true);
    
    try {
      const response = await authenticatedDelete(getApiPath(`api/cc-pp-mapping?id=${selectedRecord.id}`));
      
      const result = await response.json();
      
      if (result.success) {
        await fetchData(); // Refresh data
        handleCloseModal();
      } else {
        setError(result.error || 'Failed to delete record');
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete record');
    } finally {
      setSubmitting(false);
    }
  }, [selectedRecord]);

  // Modal handlers
  const handleAddClick = useCallback(() => {
    setFormData({});
    setFormErrors({});
    setShowAddModal(true);
  }, []);

  const handleEditClick = useCallback((record: CCPPMapping) => {
    setSelectedRecord(record);
    setFormData({ ...record });
    setFormErrors({});
    setShowEditModal(true);
  }, []);

  const handleDeleteClick = useCallback((record: CCPPMapping) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setSelectedRecord(null);
    setFormData({});
    setFormErrors({});
  }, []);

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    setFormErrors(prev => {
      if (prev[field]) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return prev;
    });
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    const allColumns = schema.map(col => col.column_name);
    const editableColumns = allColumns.filter(col => 
      col !== 'id' && 
      !col.includes('created_at') && 
      !col.includes('updated_at')
    );
    
    // Check if we have any data at all
    const hasAnyData = Object.keys(formData).some(key => 
      formData[key] !== null && formData[key] !== undefined && formData[key] !== ''
    );
    
    if (!hasAnyData) {
      errors.general = 'Please fill in at least one field';
    }
    
    editableColumns.forEach(col => {
      const schemaCol = schema.find(s => s.column_name === col);
      if (schemaCol && schemaCol.is_nullable === 'NO' && !formData[col]) {
        errors[col] = `${col.replace(/_/g, ' ')} is required`;
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [schema, formData]);

  const handleFormSubmit = useCallback(() => {
    if (validateForm()) {
      if (showEditModal) {
        updateRecord();
      } else {
        createRecord();
      }
    }
  }, [validateForm, showEditModal, updateRecord, createRecord]);

  // Get all unique column names from the data or schema
  const getAllColumns = () => {
    if (schema && Array.isArray(schema) && schema.length > 0) {
      return schema.map(col => col.column_name);
    }
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    const columns = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        columns.add(key);
      });
    });
    return Array.from(columns).sort();
  };

  // Filter data based on search term
  const filteredData = (data && Array.isArray(data) ? data : []).filter(row =>
    Object.values(row).some(value => 
      value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const columns = getAllColumns();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-gray-900 dark:text-white font-medium">Loading database data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4 sm:gap-0">
            <div className="flex items-center w-full sm:w-auto">
              <button
                onClick={() => router.push("/admin")}
                className="mr-3 sm:mr-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-8 h-8 sm:w-10 sm:hForm Status-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">CC PP(Peraturan Perusahaan) Mapping</h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  Database: n8n_mapping_bu_cc_pp ({filteredData.length} records)
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleAddClick}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Add New Record</span>
                <span className="sm:hidden">Add</span>
              </button>
              <button
                onClick={fetchData}
                className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-xs sm:text-sm font-medium text-red-800 dark:text-red-200">
                  Database Connection Error
                </h3>
                <div className="mt-2 text-xs sm:text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                  <p className="mt-1">
                    <strong>Check:</strong> Database connection, table existence, and credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Made scrollable */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pb-12">
        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search in all columns..."
                  className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          {/* Table Header Info */}
          <div className="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                  Total Records: {filteredData.length}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (Columns: {columns.length})
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Auto-refreshes every 30 seconds • Scroll horizontally and vertically
              </div>
            </div>
          </div>
          
          {/* Table Container with Reduced Height */}
          <div className="enhanced-table-scroll" style={{ maxHeight: '60vh' }}>
            <div className="min-w-max">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky-header">
                  <tr>
                    {columns.map((column) => (
                      <th 
                        key={column} 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap border-r border-gray-200 dark:border-gray-600 last:border-r-0 min-w-[120px]"
                      >
                        {column.replace(/_/g, ' ')}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap min-w-[140px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredData.map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {columns.map((column) => {
                        const cellValue = row[column];
                        const displayValue = cellValue === null || cellValue === undefined ? '-' : cellValue.toString();
                        
                        return (
                          <td 
                            key={column} 
                            className="table-cell-enhanced px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                            title={displayValue}
                          >
                            <div className="break-words">
                              {displayValue}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(row)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Edit record"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(row)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Delete record"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Scrolling Instructions */}
          <div className="px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>💡 Scroll horizontally and vertically within the table area • Scroll page to see more content</span>
              <span>Showing {filteredData.length} of {(data && Array.isArray(data) ? data : []).length} records</span>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && !loading && (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">
              {searchTerm ? 'No matching records found' : 'No data in table'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs sm:text-sm mt-1">
              {searchTerm ? 'Try adjusting your search terms' : 'The database table appears to be empty'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <FormModal
        isEdit={false}
        isOpen={showAddModal}
        formData={formData}
        formErrors={formErrors}
        schema={schema}
        submitting={submitting}
        onClose={handleCloseModal}
        onFormChange={handleFormChange}
        onSubmit={handleFormSubmit}
      />
      <FormModal
        isEdit={true}
        isOpen={showEditModal}
        formData={formData}
        formErrors={formErrors}
        schema={schema}
        submitting={submitting}
        onClose={handleCloseModal}
        onFormChange={handleFormChange}
        onSubmit={handleFormSubmit}
      />
      <DeleteModal
        isOpen={showDeleteModal}
        selectedRecord={selectedRecord}
        submitting={submitting}
        onClose={handleCloseModal}
        onDelete={deleteRecord}
      />
    </div>
  );
}
