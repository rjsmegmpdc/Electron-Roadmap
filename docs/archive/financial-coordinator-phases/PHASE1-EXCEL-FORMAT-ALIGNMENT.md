# Phase 1: Import Manager - Excel Format Alignment ✅

**Status**: Updated with Exact Excel Formats  
**Date**: 2 December 2025  
**Source**: 98047 Modern Workspace modernization Financial Tracker.xlsx

---

## 📊 Excel File Analysis

### Sheet Structure
The Financial Tracker has 8 sheets:
1. **Modern Workspace modernization** - Main project data (133 rows, 41 columns)
2. **Time Tracking** - Timesheets (556 rows, 23 columns) ← Used for import
3. **Actuals** - Financial actuals (167 rows, 17 columns) ← Used for import
4. **Labour Rates** - Labour cost data (23 rows, 13 columns) ← Used for import
5. **Pivots** - Summary pivot tables
6. **SaaS Opex** - Empty
7. **AR - Modern Workspace** - Project data
8. **DF - Modern Workspace** - Project data

---

## ✅ Import Manager Format Alignment

### 1. Timesheets Import
**Source Sheet**: "Time Tracking"  
**Format Updated**: ✅ Yes

**Exact Columns Expected**:
```
Stream | Month | Name | Personnel Number | Date | Activity Type | General receiver | Number (unit)
```

**Sample Data**:
```
OneIntune | October | Abbie AllHouse | 19507812 | 2025-10-31 | N4_CAP | N.93003271.004 | 8.0
```

**Key Points**:
- Stream: Project/workstream name (e.g., OneIntune, Luma)
- Month: Auto-generated from Date (formula: =TEXT(G2, "mmmm"))
- Name: Employee name
- Personnel Number: SAP personnel ID (links to Resources)
- Date: Date value (auto-converted from Excel date serial)
- Activity Type: N4_CAP, N4_OPX, N5_CAP, N5_OPX, etc.
- General receiver: WBSE code (N.93003271.004 = Capped Labour)
- Number (unit): Hours as decimal (e.g., 8.0, 6.5)

---

### 2. Actuals Import
**Source Sheet**: "Actuals"  
**Format Updated**: ✅ Yes

**Exact Columns Expected**:
```
Month | Posting Date | Document Date | Cost Element | WBS element | Value in Obj. Crcy
```

**Sample Data**:
```
October | 2025-10-17 | 2025-10-10 | 11513000 | N.93003271.005 | 1250.50
```

**Key Points**:
- Month: Auto-generated (formula: =TEXT(B2, "mmmm"))
- Posting Date: When posted to SAP
- Document Date: When document was created
- Cost Element: SAP cost element code
  - 115* = Software
  - 116* = Hardware
  - Other = Professional Services/Contractor
- WBS element: WBSE code (N.93003271.*** format)
  - N.93003271.003 = Professional Services
  - N.93003271.004 = Capped Labour
  - N.93003271.005 = Software
  - N.93003271.006 = Hardware
- Value in Obj. Crcy: Amount in NZD (no currency conversion needed)

---

### 3. Labour Rates Import
**Source Sheet**: "Labour Rates"  
**Format Updated**: ✅ Yes

**Exact Columns Expected**:
```
Band | Local Band | Activity Type | Hourly Rate | Daily Rate
```

**Sample Data**:
```
CAPEX BAND H (N4_CAP) | Local Band H | N4_CAP | $92.63 | $741.01
CAPEX BAND J (N5_CAP) | Local Band J | N5_CAP | $103.45 | $827.60
```

**Key Points**:
- Band: Full band description with activity type
- Local Band: Simplified name
- Activity Type: N4_CAP, N4_OPX, N5_CAP, N5_OPX, etc.
- Hourly Rate: Can be "$92.63" or "92.63" (symbol optional)
- Daily Rate: Should equal Hourly Rate × 8
- Fiscal Year: Specified during import (FY26, FY27, etc.)
- Important: **ALL existing rates for the fiscal year are replaced**

---

## 🎨 Help Section Updates

The Import Manager now displays accurate information for each sheet:

### Timesheets Help
- References "Time Tracking" sheet specifically
- Lists exact columns: Stream, Month, Name, Personnel Number, Date, Activity Type, General receiver, Number (unit)
- Explains WBSE format (N.93003271.***)
- Activity Types: N4_CAP, N4_OPX, N5_CAP, N5_OPX, etc.
- Sample: OneIntune | October | Abbie AllHouse | 19507812 | 2025-10-31 | N4_CAP | N.93003271.004 | 8.0

### Actuals Help
- References "Actuals" sheet specifically
- Lists exact columns: Month, Posting Date, Document Date, Cost Element, WBS element, Value in Obj. Crcy
- Cost Element auto-categorization: Software (115*), Hardware (116*), Professional Services
- WBSE format and mapping explained
- Sample: October | 2025-10-17 | 2025-10-10 | 11513000 | N.93003271.005 | 1250.50

### Labour Rates Help
- References "Labour Rates" sheet specifically
- Lists exact columns: Band, Local Band, Activity Type, Hourly Rate, Daily Rate
- Rate format: $92.63 or 92.63 (symbol optional)
- 8x check explanation (Daily = Hourly × 8)
- Fiscal year replacement warning
- Sample: CAPEX BAND H (N4_CAP) | Local Band H | N4_CAP | $92.63 | $741.01

---

## 🔄 Column Mapping

### Timesheets: Time Tracking Sheet
| Excel Column | Expected Format | Notes |
|---|---|---|
| Stream | Text | OneIntune, Luma, etc. |
| Month | Formula or Text | Auto-generated from Date |
| Name | Text | Employee name |
| Personnel Number | Number | SAP ID (e.g., 19507812) |
| Date | Date | Excel date format |
| Activity Type | Text | N4_CAP, N4_OPX, N5_CAP, N5_OPX |
| General receiver | Text | WBSE (N.93003271.***) |
| Number (unit) | Number | Hours (8.0, 6.5, etc.) |

### Actuals: Actuals Sheet
| Excel Column | Expected Format | Notes |
|---|---|---|
| Month | Formula or Text | Auto-generated from Posting Date |
| Posting Date | Date | When posted to SAP |
| Document Date | Date | When document created |
| Cost Element | Number | 115* (Software), 116* (Hardware), etc. |
| WBS element | Text | WBSE (N.93003271.***) |
| Value in Obj. Crcy | Number | Amount in NZD |

### Labour Rates: Labour Rates Sheet
| Excel Column | Expected Format | Notes |
|---|---|---|
| Band | Text | CAPEX BAND H (N4_CAP), etc. |
| Local Band | Text | Local Band H, etc. |
| Activity Type | Text | N4_CAP, N4_OPX, N5_CAP, N5_OPX |
| Hourly Rate | Number or Currency | $92.63 or 92.63 |
| Daily Rate | Number or Currency | $741.01 or 741.01 |

---

## 📝 WBSE Code Mapping

From the Excel file, WBSE codes represent:
```
N.93003271.003 = Professional Services
N.93003271.004 = Capped Labour (FTE staff time)
N.93003271.005 = Software (licenses, subscriptions)
N.93003271.006 = Hardware (equipment, infrastructure)
```

**SAP Code**: N.93003271  
**IO Code**: 18000026755  
**AUC Number**: 900000124090  
**Final Asset**: 100000232510  

---

## ✅ Build Status

- `npm run build:main` ✅ Success
- `npm run typecheck` ✅ Success (in Import Manager code)
- Navigation integration ✅ Complete
- Help sections ✅ Updated with exact formats

---

## 🚀 Ready for Testing

The Import Manager is now configured to accept data in the exact format from the Financial Tracker Excel file:
- Users can export from the Time Tracking sheet and import timesheets
- Users can export from the Actuals sheet and import actuals
- Users can export from the Labour Rates sheet and import rates with fiscal year

All column names, formats, and examples match the actual Excel structure.

---

## 📚 Files Updated

- `app/renderer/pages/CoordinatorImport.tsx` - Updated help sections and descriptions
- Build verified: ✅ No compilation errors

---

**Next Step**: Test with actual Excel exports to verify IPC integration and data flow.
