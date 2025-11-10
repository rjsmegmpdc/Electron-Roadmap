import React, { useState, useEffect } from 'react';
import { parseICalFile, type ICalEvent } from '../utils/icalParser';

interface CalendarMonth {
  id?: number;
  year: number;
  month: number;
  days: number;
  working_days: number;
  weekend_days: number;
  public_holidays: number;
  work_hours: number;
  notes: string;
}

interface PublicHoliday {
  id?: number;
  name: string;
  date: string;
  year: number;
  month: number;
  day: number;
  description: string;
  is_recurring: boolean;
  source: string;
}

export const CalendarManager: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthData, setMonthData] = useState<CalendarMonth | null>(null);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importedHolidays, setImportedHolidays] = useState<ICalEvent[]>([]);
  const [showAddHolidayForm, setShowAddHolidayForm] = useState(false);
  const [showBulkEntryForm, setShowBulkEntryForm] = useState(false);
  const [bulkHolidayText, setBulkHolidayText] = useState('');
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    start_date: '',
    end_date: '',
    description: '',
    is_recurring: false
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    loadMonthData();
    loadHolidays();
  }, [selectedYear, selectedMonth]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const calculateWeekendDays = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    let weekendDays = 0;
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendDays++;
      }
    }
    
    return weekendDays;
  };

  const loadMonthData = async () => {
    if (!window.electronAPI?.getCalendarMonth) return;
    
    setLoading(true);
    try {
      const data = await window.electronAPI.getCalendarMonth(selectedYear, selectedMonth);
      
      if (data) {
        setMonthData(data);
      } else {
        // Initialize with defaults
        const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
        const weekendDays = calculateWeekendDays(selectedYear, selectedMonth);
        
        setMonthData({
          year: selectedYear,
          month: selectedMonth,
          days: daysInMonth,
          working_days: daysInMonth - weekendDays,
          weekend_days: weekendDays,
          public_holidays: 0,
          work_hours: (daysInMonth - weekendDays) * 8,
          notes: ''
        });
      }
    } catch {
      // Silent fail - will use defaults
    } finally {
      setLoading(false);
    }
  };

  const loadHolidays = async () => {
    if (!window.electronAPI?.getPublicHolidays) return;
    
    try {
      const data = await window.electronAPI.getPublicHolidays(selectedYear, selectedMonth);
      setHolidays(data || []);
    } catch {
      // Silent fail
    }
  };

  const saveMonthData = async () => {
    if (!monthData || !window.electronAPI?.saveCalendarMonth) return;
    
    setLoading(true);
    try {
      await window.electronAPI.saveCalendarMonth(monthData);
      setImportStatus('Month data saved successfully!');
      setTimeout(() => setImportStatus(''), 3000);
    } catch {
      setImportStatus('Failed to save month data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImportStatus('Reading file...');

    try {
      const text = await file.text();
      const result = parseICalFile(text);

      if (result.errors.length > 0) {
        setImportStatus(`Parsed with ${result.errors.length} errors`);
      } else {
        setImportStatus(`Found ${result.holidays.length} holidays`);
      }

      setImportedHolidays(result.holidays);
      setShowImportModal(true);
    } catch {
      setImportStatus('Failed to import file');
    } finally {
      setLoading(false);
      event.target.value = '';
    }
  };

  const confirmImport = async () => {
    if (!window.electronAPI?.importPublicHolidays) return;
    
    setLoading(true);
    try {
      const holidaysToImport = importedHolidays.map(h => ({
        name: h.name,
        start_date: h.start_date,
        end_date: h.end_date,
        year: h.year,
        month: h.month,
        day: h.day,
        end_year: h.end_year,
        end_month: h.end_month,
        end_day: h.end_day,
        description: h.description,
        is_recurring: h.isRecurring,
        source: 'ical'
      }));

      await window.electronAPI.importPublicHolidays(holidaysToImport);
      setImportStatus(`Imported ${holidaysToImport.length} holidays successfully!`);
      setShowImportModal(false);
      setImportedHolidays([]);
      loadHolidays();
      setTimeout(() => setImportStatus(''), 3000);
    } catch {
      setImportStatus('Failed to import holidays');
    } finally {
      setLoading(false);
    }
  };

  const deleteHoliday = async (id: number) => {
    if (!window.electronAPI?.deletePublicHoliday) return;
    
    try {
      await window.electronAPI.deletePublicHoliday(id);
      loadHolidays();
    } catch {
      // Silent fail
    }
  };

  const addCustomHoliday = async () => {
    if (!newHoliday.name || !newHoliday.start_date || !newHoliday.end_date) {
      setImportStatus('Holiday name, start date, and end date are required');
      return;
    }

    // Parse start date (DD-MM-YYYY)
    const startParts = newHoliday.start_date.split('-');
    if (startParts.length !== 3) {
      setImportStatus('Start date must be in DD-MM-YYYY format');
      return;
    }

    const startDay = parseInt(startParts[0]);
    const startMonth = parseInt(startParts[1]);
    const startYear = parseInt(startParts[2]);

    if (isNaN(startDay) || isNaN(startMonth) || isNaN(startYear) || startDay < 1 || startDay > 31 || startMonth < 1 || startMonth > 12) {
      setImportStatus('Invalid start date format');
      return;
    }

    // Parse end date (DD-MM-YYYY)
    const endParts = newHoliday.end_date.split('-');
    if (endParts.length !== 3) {
      setImportStatus('End date must be in DD-MM-YYYY format');
      return;
    }

    const endDay = parseInt(endParts[0]);
    const endMonth = parseInt(endParts[1]);
    const endYear = parseInt(endParts[2]);

    if (isNaN(endDay) || isNaN(endMonth) || isNaN(endYear) || endDay < 1 || endDay > 31 || endMonth < 1 || endMonth > 12) {
      setImportStatus('Invalid end date format');
      return;
    }

    // Validate end date is not before start date
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    if (endDate < startDate) {
      setImportStatus('End date must be on or after start date');
      return;
    }

    setLoading(true);
    try {
      const holidayToAdd = [{
        name: newHoliday.name,
        start_date: newHoliday.start_date,
        end_date: newHoliday.end_date,
        year: startYear,
        month: startMonth,
        day: startDay,
        end_year: endYear,
        end_month: endMonth,
        end_day: endDay,
        description: newHoliday.description,
        is_recurring: newHoliday.is_recurring,
        source: 'manual'
      }];

      await window.electronAPI.importPublicHolidays(holidayToAdd);
      setImportStatus('Holiday added successfully!');
      setShowAddHolidayForm(false);
      setNewHoliday({ name: '', start_date: '', end_date: '', description: '', is_recurring: false });
      loadHolidays();
      setTimeout(() => setImportStatus(''), 3000);
    } catch {
      setImportStatus('Failed to add holiday');
    } finally {
      setLoading(false);
    }
  };

  const addBulkHolidays = async () => {
    if (!bulkHolidayText.trim()) {
      setImportStatus('Please enter holidays in the format: Name, Start Date, End Date');
      return;
    }

    const lines = bulkHolidayText.split('\n').filter(line => line.trim());
    const holidaysToAdd: Array<{
      name: string;
      start_date: string;
      end_date: string;
      year: number;
      month: number;
      day: number;
      end_year: number;
      end_month: number;
      end_day: number;
      description: string;
      is_recurring: boolean;
      source: string;
    }> = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length < 3) {
        errors.push(`Line ${i + 1}: Invalid format (need Name, Start Date, End Date)`);
        continue;
      }

      const name = parts[0];
      const startDate = parts[1];
      const endDate = parts[2];
      const description = parts.length > 3 ? parts.slice(3).join(', ') : '';

      // Parse start date (DD-MM-YYYY)
      const startParts = startDate.split('-');
      if (startParts.length !== 3) {
        errors.push(`Line ${i + 1}: Invalid start date format (use DD-MM-YYYY)`);
        continue;
      }

      const startDay = parseInt(startParts[0]);
      const startMonth = parseInt(startParts[1]);
      const startYear = parseInt(startParts[2]);

      if (isNaN(startDay) || isNaN(startMonth) || isNaN(startYear) || startDay < 1 || startDay > 31 || startMonth < 1 || startMonth > 12) {
        errors.push(`Line ${i + 1}: Invalid start date values`);
        continue;
      }

      // Parse end date (DD-MM-YYYY)
      const endParts = endDate.split('-');
      if (endParts.length !== 3) {
        errors.push(`Line ${i + 1}: Invalid end date format (use DD-MM-YYYY)`);
        continue;
      }

      const endDay = parseInt(endParts[0]);
      const endMonth = parseInt(endParts[1]);
      const endYear = parseInt(endParts[2]);

      if (isNaN(endDay) || isNaN(endMonth) || isNaN(endYear) || endDay < 1 || endDay > 31 || endMonth < 1 || endMonth > 12) {
        errors.push(`Line ${i + 1}: Invalid end date values`);
        continue;
      }

      // Validate end date is not before start date
      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);
      if (end < start) {
        errors.push(`Line ${i + 1}: End date must be on or after start date`);
        continue;
      }

      holidaysToAdd.push({
        name,
        start_date: startDate,
        end_date: endDate,
        year: startYear,
        month: startMonth,
        day: startDay,
        end_year: endYear,
        end_month: endMonth,
        end_day: endDay,
        description,
        is_recurring: false,
        source: 'manual'
      });
    }

    if (errors.length > 0) {
      setImportStatus(`Found ${errors.length} error(s). First error: ${errors[0]}`);
      return;
    }

    if (holidaysToAdd.length === 0) {
      setImportStatus('No valid holidays found');
      return;
    }

    setLoading(true);
    try {
      await window.electronAPI.importPublicHolidays(holidaysToAdd);
      setImportStatus(`Successfully added ${holidaysToAdd.length} holidays!`);
      setShowBulkEntryForm(false);
      setBulkHolidayText('');
      loadHolidays();
      setTimeout(() => setImportStatus(''), 3000);
    } catch {
      setImportStatus('Failed to add holidays');
    } finally {
      setLoading(false);
    }
  };

  const updateMonthField = (field: keyof CalendarMonth, value: number | string) => {
    if (!monthData) return;
    
    const updated = { ...monthData, [field]: value };
    
    // Auto-calculate work hours if working days changed
    if (field === 'working_days' && typeof value === 'number') {
      updated.work_hours = value * 8;
    }
    
    // Auto-calculate working days if public holidays changed
    if (field === 'public_holidays') {
      const baseWorkingDays = monthData.days - monthData.weekend_days;
      updated.working_days = baseWorkingDays - (value as number);
      updated.work_hours = updated.working_days * 8;
    }
    
    setMonthData(updated);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>📅 Calendar Management</h2>
        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
          Manage working days, holidays, and work hours by year and month
        </p>
      </div>

      {/* Year/Month Picker */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#495057' }}>
            Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px'
            }}
          >
            {monthNames.map((name, idx) => (
              <option key={idx} value={idx + 1}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Data Form */}
      {monthData && (
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          marginBottom: '24px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#2c3e50' }}>
            {monthNames[selectedMonth - 1]} {selectedYear}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6c757d' }}>
                Total Days
              </label>
              <input
                type="number"
                value={monthData.days}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  backgroundColor: '#e9ecef',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6c757d' }}>
                Weekend Days
              </label>
              <input
                type="number"
                value={monthData.weekend_days}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  backgroundColor: '#e9ecef',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6c757d' }}>
                Public Holidays *
              </label>
              <input
                type="number"
                value={monthData.public_holidays}
                onChange={(e) => updateMonthField('public_holidays', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6c757d' }}>
                Working Days
              </label>
              <input
                type="number"
                value={monthData.working_days}
                onChange={(e) => updateMonthField('working_days', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6c757d' }}>
                Work Hours
              </label>
              <input
                type="number"
                value={monthData.work_hours}
                onChange={(e) => updateMonthField('work_hours', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6c757d' }}>
              Notes
            </label>
            <textarea
              value={monthData.notes}
              onChange={(e) => updateMonthField('notes', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              placeholder="Add any notes about this month..."
            />
          </div>

          <button
            onClick={saveMonthData}
            disabled={loading}
            className="btn primary"
            style={{ marginTop: '16px' }}
          >
            {loading ? 'Saving...' : 'Save Month Data'}
          </button>
        </div>
      )}

      {/* Public Holidays Section */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Public Holidays</h3>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setShowAddHolidayForm(!showAddHolidayForm);
                if (showBulkEntryForm) setShowBulkEntryForm(false);
              }}
              className="btn secondary"
              style={{ margin: 0 }}
            >
              ➕ Add Holiday
            </button>
            <button
              onClick={() => {
                setShowBulkEntryForm(!showBulkEntryForm);
                if (showAddHolidayForm) setShowAddHolidayForm(false);
              }}
              className="btn secondary"
              style={{ margin: 0 }}
            >
              📝 Bulk Entry
            </button>
            <label
              className="btn secondary"
              style={{ cursor: 'pointer', margin: 0 }}
            >
              📥 Import iCal
              <input
                type="file"
                accept=".ics,.ical"
                onChange={handleFileImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {importStatus && (
          <div style={{
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '4px',
            backgroundColor: importStatus.includes('Failed') || importStatus.includes('Invalid') || importStatus.includes('required') ? '#fee' : '#efe',
            color: importStatus.includes('Failed') || importStatus.includes('Invalid') || importStatus.includes('required') ? '#c33' : '#383',
            fontSize: '13px'
          }}>
            {importStatus}
          </div>
        )}

        {/* Add Custom Holiday Form */}
        {showAddHolidayForm && (
          <div style={{
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Add Custom Holiday</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>
                  Holiday Name *
                </label>
                <input
                  type="text"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  placeholder="e.g., Christmas/New Year Shutdown"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>
                    Start Date (DD-MM-YYYY) *
                  </label>
                  <input
                    type="text"
                    value={newHoliday.start_date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, start_date: e.target.value })}
                    placeholder="25-12-2025"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>
                    End Date (DD-MM-YYYY) *
                  </label>
                  <input
                    type="text"
                    value={newHoliday.end_date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, end_date: e.target.value })}
                    placeholder="02-01-2026"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>
                  Description
                </label>
                <input
                  type="text"
                  value={newHoliday.description}
                  onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                  placeholder="Optional notes"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ced4da',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#495057', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newHoliday.is_recurring}
                  onChange={(e) => setNewHoliday({ ...newHoliday, is_recurring: e.target.checked })}
                  style={{ cursor: 'pointer' }}
                />
                Recurring annually
              </label>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddHolidayForm(false);
                  setNewHoliday({ name: '', start_date: '', end_date: '', description: '', is_recurring: false });
                }}
                className="btn secondary"
              >
                Cancel
              </button>
              <button
                onClick={addCustomHoliday}
                disabled={loading}
                className="btn primary"
              >
                {loading ? 'Adding...' : 'Add Holiday'}
              </button>
            </div>
          </div>
        )}

        {/* Bulk Entry Form */}
        {showBulkEntryForm && (
          <div style={{
            padding: '16px',
            marginBottom: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Bulk Holiday Entry</h4>
            
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6c757d' }}>
              Enter one holiday per line in the format: <strong>Name, Start Date, End Date, Description (optional)</strong>
            </p>
            
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#6c757d', fontFamily: 'monospace', backgroundColor: '#fff', padding: '8px', borderRadius: '4px' }}>
              Example:<br />
              New Year's Day, 01-01-2025, 01-01-2025<br />
              Christmas/New Year Break, 25-12-2025, 02-01-2026<br />
              Easter Weekend, 18-04-2025, 21-04-2025, Long weekend
            </p>

            <textarea
              value={bulkHolidayText}
              onChange={(e) => setBulkHolidayText(e.target.value)}
              rows={10}
              placeholder="New Year's Day, 01-01-2025, 01-01-2025
Christmas Shutdown, 25-12-2025, 02-01-2026
Easter Break, 18-04-2025, 21-04-2025"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: '13px',
                fontFamily: 'monospace',
                resize: 'vertical'
              }}
            />

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowBulkEntryForm(false);
                  setBulkHolidayText('');
                }}
                className="btn secondary"
              >
                Cancel
              </button>
              <button
                onClick={addBulkHolidays}
                disabled={loading}
                className="btn primary"
              >
                {loading ? 'Adding...' : 'Add All Holidays'}
              </button>
            </div>
          </div>
        )}

        {holidays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#6c757d' }}>
            No public holidays for {monthNames[selectedMonth - 1]} {selectedYear}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {holidays.map((holiday) => (
              <div
                key={holiday.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: '#2c3e50' }}>{holiday.name}</div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {holiday.start_date === holiday.end_date 
                      ? holiday.start_date
                      : `${holiday.start_date} to ${holiday.end_date}`
                    }
                    {holiday.description && ` • ${holiday.description}`}
                  </div>
                </div>
                <button
                  onClick={() => holiday.id && deleteHoliday(holiday.id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Preview Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Preview Import</h3>
            <p style={{ margin: '0 0 16px 0', color: '#666' }}>
              Found {importedHolidays.length} holidays. Review and confirm import:
            </p>

            <div style={{
              maxHeight: '300px',
              overflow: 'auto',
              marginBottom: '16px',
              border: '1px solid #e9ecef',
              borderRadius: '4px'
            }}>
              {importedHolidays.map((holiday, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderBottom: idx < importedHolidays.length - 1 ? '1px solid #e9ecef' : 'none'
                  }}
                >
                  <div style={{ fontWeight: '600' }}>{holiday.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {holiday.start_date === holiday.end_date 
                      ? holiday.start_date
                      : `${holiday.start_date} to ${holiday.end_date}`
                    }
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportedHolidays([]);
                }}
                className="btn secondary"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={loading}
                className="btn primary"
              >
                {loading ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
