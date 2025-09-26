import React, { useState, useMemo } from 'react';
import { useTipologie } from '../hooks/useTipologie';
import Modal from './Modal';
import { Pen, Trash2, Plus, Search, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { updateDatabaseRecordFull, deleteDatabaseRecord, createDatabaseRecord } from '../services/databaseRecordsService';
import { showSuccess, showError } from '../services/toastService';

const Table = ({ data, updateRecord, refreshRecords }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [createMode, setCreateMode] = useState(false);
    const [form, setForm] = useState({ descrizione: '', valore: '', codLineaProd: '', codPostazione: '', tipologia: 0 });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortField, setSortField] = useState('');
    const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const { tipologie } = useTipologie();

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    // Filter and sort data based on search term and sorting
    const filteredData = useMemo(() => {
        let filtered = data || [];
        
        // Apply search filter
        if (searchTerm.trim() && filtered.length > 0) {
            filtered = filtered.filter(row => {
                const formattedDate = formatDate(row.dateAdded);
                
                return (
                    row.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    row.codLineaProd?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    row.codPostazione?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    row.valore?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                    formattedDate.includes(searchTerm) ||
                    tipologie.find(t => t.idTipologia === row.tipologia)?.desSignificato?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            });
        }
        
        // Apply sorting
        if (sortField && filtered.length > 0) {
            filtered = [...filtered].sort((a, b) => {
                let aValue, bValue;
                
                switch (sortField) {
                    case 'description':
                        aValue = a.description?.toLowerCase() || '';
                        bValue = b.description?.toLowerCase() || '';
                        break;
                    case 'codLineaProd':
                        aValue = a.codLineaProd?.toLowerCase() || '';
                        bValue = b.codLineaProd?.toLowerCase() || '';
                        break;
                    case 'codPostazione':
                        aValue = a.codPostazione?.toLowerCase() || '';
                        bValue = b.codPostazione?.toLowerCase() || '';
                        break;
                    case 'tipologia':
                        aValue = tipologie.find(t => t.idTipologia === a.tipologia)?.desSignificato?.toLowerCase() || '';
                        bValue = tipologie.find(t => t.idTipologia === b.tipologia)?.desSignificato?.toLowerCase() || '';
                        break;
                    case 'date':
                        aValue = new Date(a.dateAdded);
                        bValue = new Date(b.dateAdded);
                        break;
                    default:
                        return 0;
                }
                
                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return filtered;
    }, [data, searchTerm, tipologie, sortField, sortDirection]);

    // Paginate filtered data
    const paginatedData = useMemo(() => {
        if (!filteredData || filteredData.length === 0) {
            return [];
        }
        if (recordsPerPage === 'all') {
            return filteredData;
        }
        const startIndex = (currentPage - 1) * recordsPerPage;
        return filteredData.slice(startIndex, startIndex + recordsPerPage);
    }, [filteredData, currentPage, recordsPerPage]);

    const totalPages = recordsPerPage === 'all' ? 1 : Math.ceil((filteredData?.length || 0) / recordsPerPage);

    // Reset to first page when search changes
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    // Handle records per page change
    const handleRecordsPerPageChange = (newRecordsPerPage) => {
        setRecordsPerPage(newRecordsPerPage);
        setCurrentPage(1);
    };

    // Handle column sorting
    const handleSort = (field) => {
        if (sortField === field) {
            // If clicking the same field, toggle direction
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // If clicking a new field, set it as sort field with ascending direction
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1); // Reset to first page when sorting
    };

    // Sortable header component
    const SortableHeader = ({ field, children, className = "" }) => (
        <th 
            className={`px-4 py-2 border-b-2 border-gray-300 cursor-pointer hover:bg-gray-50 ${className}`}
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center justify-center gap-1">
                {children}
                {sortField === field && (
                    <span className="text-red-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                )}
            </div>
        </th>
    );

    const handleRowClick = (row) => {
        setSelectedRow(row);
        setForm({
            descrizione: row.description || '',
            valore: row.value || row.valore || '',
            codLineaProd: row.codLineaProd || '',
            codPostazione: row.codPostazione || '',
            tipologia: row.tipologia || 0
        });
        setEditMode(false);
        setModalOpen(true);
    };

    const handleEditClick = () => {
        setEditMode(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditMode(false);
        setCreateMode(false);
        setSelectedRow(null);
        setShowDeleteConfirm(false);
        setForm({ descrizione: '', valore: '', codLineaProd: '', codPostazione: '', tipologia: 0 });
    };

    const handleCreateClick = () => {
        setCreateMode(true);
        setEditMode(false);
        setSelectedRow(null);
        setForm({ descrizione: '', valore: '', codLineaProd: '', codPostazione: '', tipologia: 0 });
        setModalOpen(true);
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            const res = await deleteDatabaseRecord(selectedRow.id);
            if (res.success) {
                showSuccess(res.message || 'Record eliminato');
                handleCloseModal();
                if (refreshRecords) await refreshRecords();
            } else {
                showError(res.message || 'Eliminazione fallita');
            }
        } catch (err) {
            showError('Eliminazione fallita');
        }
        setDeleting(false);
        setShowDeleteConfirm(false);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    const isCreateFormValid = () => {
        return form.descrizione.trim() !== '' && 
               form.valore.trim() !== '' && 
               form.codLineaProd.trim() !== '' && 
               form.codLineaProd.trim().length <= 18 &&
               form.codPostazione.trim() !== '' && 
               form.codPostazione.trim().length <= 50 &&
               form.tipologia !== '' && 
               form.tipologia !== 0;
    };

    const isEditFormValid = () => {
        return form.descrizione.trim() !== '' && 
               form.valore.trim() !== '' && 
               form.codLineaProd.trim() !== '' && 
               form.codLineaProd.trim().length <= 18 &&
               form.codPostazione.trim() !== '' && 
               form.codPostazione.trim().length <= 50 &&
               form.tipologia !== '' && 
               form.tipologia !== 0;
    };

    const getModalFooter = () => {
        if (createMode) {
            return (
                <>
                    <button 
                        type="button" 
                        className="px-3 py-1 bg-gray-300 rounded" 
                        onClick={handleCloseModal}
                    >
                        Annulla
                    </button>
                    <button
                        type="button"
                        className={`px-3 py-1 rounded flex items-center justify-center ${
                            isCreateFormValid() && !saving 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!isCreateFormValid() || saving}
                        onClick={async () => {
                            setSaving(true);
                            try {
                                const res = await createDatabaseRecord(form);
                                if (res.success) {
                                    showSuccess(res.message || 'Record creato con successo');
                                    handleCloseModal();
                                    if (refreshRecords) await refreshRecords();
                                } else {
                                    showError(res.message || 'Creazione fallita');
                                }
                            } catch (err) {
                                showError('Creazione fallita');
                            }
                            setSaving(false);
                        }}
                    >
                        {saving ? 'Creando...' : 'Crea'}
                    </button>
                </>
            );
        }

        if (!selectedRow) return null;

        if (!editMode) {
            return (
                <>
                    <button 
                        type="button" 
                        className="px-3 py-1 bg-blue-500 text-white rounded flex items-center" 
                        onClick={handleEditClick}
                    >
                        <Pen size={16} className="mr-1" /> Modifica
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1 bg-red-500 text-white rounded flex items-center"
                        disabled={deleting}
                        onClick={handleDeleteClick}
                    >
                        {deleting ? (
                            <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                        ) : <Trash2 size={16} className="mr-1" />}
                        Elimina
                    </button>
                    <button 
                        type="button" 
                        className="px-3 py-1 bg-gray-300 rounded" 
                        onClick={handleCloseModal}
                    >
                        Chiudi
                    </button>
                </>
            );
        }

        return (
            <>
                <button 
                    type="button" 
                    className="px-3 py-1 bg-gray-300 rounded" 
                    onClick={() => setEditMode(false)}
                >
                    Annulla
                </button>
                <button
                    type="button"
                    className={`px-3 py-1 rounded flex items-center justify-center ${
                        isEditFormValid() && !saving 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    disabled={!isEditFormValid() || saving}
                    onClick={async () => {
                        setSaving(true);
                        try {
                            const res = await updateDatabaseRecordFull(selectedRow.id, form);
                            if (res.success) {
                                showSuccess(res.message || 'Record aggiornato');
                                handleCloseModal();
                                if (refreshRecords) await refreshRecords();
                            } else {
                                showError(res.message || 'Aggiornamento fallito');
                            }
                        } catch (err) {
                            showError('Aggiornamento fallito');
                        }
                        setSaving(false);
                    }}
                >
                    {saving ? 'Salvando...' : 'Salva'}
                </button>
            </>
        );
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Header with search and create button */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Cerca per descrizione, codice linea, codice postazione, valore, data o tipologia..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={handleCreateClick}
                        className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Nuovo Record
                    </button>
                </div>

                {/* Table */}
                <table className="w-full">
                    <thead className="bg-gray-400">
                        <tr>
                            <SortableHeader field="description" className="text-left">
                                Descrizione
                            </SortableHeader>
                            <SortableHeader field="codLineaProd" className="text-center">
                                Cod. Linea Prod
                            </SortableHeader>
                            <SortableHeader field="codPostazione" className="text-center">
                                Cod. Postazione
                            </SortableHeader>
                            <SortableHeader field="tipologia" className="text-center">
                            Tipologia
                        </SortableHeader>
                        <SortableHeader field="date" className="text-center">
                            Data
                        </SortableHeader>
                    </tr>
                </thead>
                <tbody>
                    {paginatedData.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                <div className="flex flex-col items-center gap-2">
                                    {searchTerm ? (
                                        <>
                                            <div className="text-lg">Nessun record trovato</div>
                                            <div className="text-sm">Prova a modificare i termini di ricerca</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-lg">Nessun record trovato</div>
                                            <div className="text-sm">Clicca su "Nuovo Record" per aggiungere il primo record</div>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ) : (
                        paginatedData.map((row) => (
                            <tr 
                                key={row.id} 
                                className="hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleRowClick(row)}
                            >
                                <td className="px-4 py-2 border-b font-bold">{row.description}</td>
                                <td className="px-4 py-2 border-b text-center">
                                    <span className="bg-gray-600 text-white px-2 py-1 rounded-md text-sm font-medium">
                                        {row.codLineaProd}
                                    </span>
                                </td>
                                <td className="px-4 py-2 border-b text-center">
                                    <span className="bg-gray-600 text-white px-2 py-1 rounded-md text-sm font-medium">
                                        {row.codPostazione}
                                    </span>
                                </td>
                                <td className="px-4 py-2 border-b text-left">
                                    {tipologie.find(t => t.idTipologia === row.tipologia)?.desSignificato || row.tipologia}
                                </td>
                                <td className="px-4 py-2 border-b text-center">
                                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm font-medium">
                                        {formatDate(row.dateAdded)}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Pagination */}
            {filteredData.length > 0 && (
                <div className="mt-4 flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">
                            {recordsPerPage === 'all' 
                                ? `Mostrando tutti i ${filteredData.length} record` 
                                : `Pagina ${currentPage} di ${totalPages} - Mostrando ${paginatedData.length} di ${filteredData.length} record`
                            }
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Record per pagina:</span>
                            <select 
                                value={recordsPerPage} 
                                onChange={(e) => handleRecordsPerPageChange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-500"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value="all">Tutti</option>
                            </select>
                        </div>
                    </div>
                    {recordsPerPage !== 'all' && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded flex items-center gap-1 ${
                                    currentPage === 1 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                            >
                                <ChevronLeft size={16} />
                                Precedente
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-1 rounded ${
                                            currentPage === page 
                                                ? 'bg-red-500 text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded flex items-center gap-1 ${
                                    currentPage === totalPages 
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                        : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                            >
                                Successiva
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

            <Modal 
                open={modalOpen} 
                title={createMode ? "Nuovo Record" : (editMode ? "Modifica Record" : "Dettagli Record")}
                footer={getModalFooter()}
            >
                {createMode && (
                    <div className="flex flex-col gap-4">
                        {/* Description */}
                        <div>
                            <label className="font-semibold block mb-1">Descrizione: <span className="text-red-500">*</span></label>
                            <input
                                className="border px-2 py-1 rounded w-full"
                                value={form.descrizione}
                                onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))}
                                required
                                placeholder="Inserisci descrizione"
                            />
                        </div>
                        
                        {/* Valore */}
                        <div>
                            <label className="font-semibold block mb-1">Valore: <span className="text-red-500">*</span></label>
                            <input
                                className="border px-2 py-1 rounded w-full"
                                value={form.valore}
                                onChange={e => setForm(f => ({ ...f, valore: e.target.value }))}
                                required
                                placeholder="Inserisci valore"
                            />
                        </div>
                        
                        {/* Cod. Linea Prod */}
                        <div>
                            <label className="font-semibold block mb-1">Cod. Linea Prod: <span className="text-red-500">*</span></label>
                            <input
                                className={`border px-2 py-1 rounded w-full ${
                                    form.codLineaProd.length > 18 ? 'border-red-500' : 'border-gray-300'
                                }`}
                                value={form.codLineaProd}
                                onChange={e => setForm(f => ({ ...f, codLineaProd: e.target.value }))}
                                required
                                placeholder="Inserisci codice linea prodotto"
                                maxLength={50}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {form.codLineaProd.length}/50 caratteri
                                {form.codLineaProd.length > 50 && (
                                    <span className="text-red-500 ml-2">Massimo 50 caratteri</span>
                                )}
                            </div>
                        </div>
                        
                        {/* Cod. Postazione */}
                        <div>
                            <label className="font-semibold block mb-1">Cod. Postazione: <span className="text-red-500">*</span></label>
                            <input
                                className={`border px-2 py-1 rounded w-full ${
                                    form.codPostazione.length > 50 ? 'border-red-500' : 'border-gray-300'
                                }`}
                                value={form.codPostazione}
                                onChange={e => setForm(f => ({ ...f, codPostazione: e.target.value }))}
                                required
                                placeholder="Inserisci codice postazione"
                                maxLength={50}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {form.codPostazione.length}/50 caratteri
                                {form.codPostazione.length > 50 && (
                                    <span className="text-red-500 ml-2">Massimo 50 caratteri</span>
                                )}
                            </div>
                        </div>
                        
                        {/* Tipologia */}
                        <div>
                            <label className="font-semibold block mb-1">Tipologia: <span className="text-red-500">*</span></label>
                            <select
                                className="border px-2 py-1 rounded w-full"
                                value={form.tipologia}
                                onChange={e => setForm(f => ({ ...f, tipologia: Number(e.target.value) }))}
                                required
                            >
                                <option value="">Seleziona tipologia</option>
                                {tipologie.map(t => (
                                    <option key={t.idTipologia} value={t.idTipologia}>{t.desSignificato}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
                {selectedRow && !editMode && !createMode && (
                    <div className="flex flex-col gap-4">
                        {/* ID, Cod Line, and Date in the same row */}
                        <div className="flex justify-between items-center gap-4">
                            <div><span className="font-semibold">ID:</span> {selectedRow.id}</div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Cod. Linea:</span>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-medium">
                                    {selectedRow.codLineaProd}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Cod. Postazione:</span>
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm font-medium">
                                    {selectedRow.codPostazione}
                                </span>
                            </div>
                            <div><span className="font-semibold">Data:</span> {formatDate(selectedRow.dateAdded)}</div>
                        </div>
                        
                        {/* Description */}
                        <div><span className="font-semibold">Descrizione:</span> {selectedRow.description}</div>
                        
                        {/* Tipologia above Valore */}
                        <div className="flex flex-col gap-2">
                            <div>
                                <span className="font-semibold">Tipologia:</span> {
                                    tipologie.find(t => t.idTipologia === selectedRow.tipologia)?.desSignificato || selectedRow.tipologia
                                }
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">Valore:</span>
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm font-bold">
                                    {selectedRow.value || selectedRow.valore}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                {selectedRow && editMode && !createMode && (
                    <div className="flex flex-col gap-4">
                        {/* ID (read-only), Cod Line, and Date (read-only) in the same row */}
                        <div className="flex justify-between items-center gap-4">
                            <div><span className="font-semibold">ID:</span> {selectedRow.id}</div>
                            <div className="flex flex-col">
                                <label className="font-semibold block mb-1">Cod. Linea:</label>
                                <input
                                    className={`border px-2 py-1 rounded text-sm ${
                                        form.codLineaProd.length > 18 ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    value={form.codLineaProd}
                                    onChange={e => setForm(f => ({ ...f, codLineaProd: e.target.value }))}
                                    required
                                    maxLength={50}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                    {form.codLineaProd.length}/50 caratteri
                                    {form.codLineaProd.length > 50 && (
                                        <span className="text-red-500 ml-2">Massimo 50 caratteri</span>
                                    )}
                                </div>
                            </div>
                            <div><span className="font-semibold">Data:</span> {formatDate(selectedRow.dateAdded)}</div>
                        </div>
                        
                        {/* Cod. Postazione */}
                        <div>
                            <label className="font-semibold block mb-1">Cod. Postazione: <span className="text-red-500">*</span></label>
                            <input
                                className={`border px-2 py-1 rounded w-full ${
                                    form.codPostazione.length > 50 ? 'border-red-500' : 'border-gray-300'
                                }`}
                                value={form.codPostazione}
                                onChange={e => setForm(f => ({ ...f, codPostazione: e.target.value }))}
                                required
                                placeholder="Inserisci codice postazione"
                                maxLength={50}
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {form.codPostazione.length}/50 caratteri
                                {form.codPostazione.length > 50 && (
                                    <span className="text-red-500 ml-2">Massimo 50 caratteri</span>
                                )}
                            </div>
                        </div>
                        
                        {/* Description */}
                        <div>
                            <label className="font-semibold block mb-1">Descrizione:</label>
                            <input
                                className="border px-2 py-1 rounded w-full"
                                value={form.descrizione}
                                onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))}
                                required
                            />
                        </div>
                        
                        {/* Tipologia above Valore */}
                        <div className="flex flex-col gap-2">
                            <div>
                                <label className="font-semibold block mb-1">Tipologia:</label>
                                <select
                                    className="border px-2 py-1 rounded w-full"
                                    value={form.tipologia}
                                    onChange={e => setForm(f => ({ ...f, tipologia: Number(e.target.value) }))}
                                    required
                                >
                                    <option value="">Seleziona tipologia</option>
                                    {tipologie.map(t => (
                                        <option key={t.idTipologia} value={t.idTipologia}>{t.desSignificato}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="font-semibold block mb-1">Valore:</label>
                                <input
                                    className="border px-2 py-1 rounded w-full"
                                    value={form.valore}
                                    onChange={e => setForm(f => ({ ...f, valore: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal 
                open={showDeleteConfirm} 
                title="Conferma Eliminazione"
                footer={
                    <>
                        <button 
                            type="button" 
                            className="px-3 py-1 bg-gray-300 rounded" 
                            onClick={handleCancelDelete}
                            disabled={deleting}
                        >
                            Annulla
                        </button>
                        <button
                            type="button"
                            className="px-3 py-1 bg-red-500 text-white rounded flex items-center"
                            disabled={deleting}
                            onClick={handleConfirmDelete}
                        >
                            {deleting ? (
                                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                            ) : <Trash2 size={16} className="mr-1" />}
                            Elimina
                        </button>
                    </>
                }
            >
                <div className="text-center py-4">
                    <p className="text-lg mb-2">Sei sicuro di voler eliminare questo record?</p>
                    <p className="text-gray-600">Questa azione non può essere annullata.</p>
                </div>
            </Modal>
        </>
    );
};

export default Table;
