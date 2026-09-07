import React, { useState, useRef, useMemo } from 'react';
import { useToast } from '../context/ToastContext';
import { MenuCategory, ParsedMenuCategory, ParsedMenuItem, MenuItemOption, MenuItemOptionGroup, MenuItem } from '../types';
import { 
  bulkImportMenu, 
  createMenuCategory, 
  createMenuItem 
} from '../api/dashboardApi';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  existingItems?: MenuItem[];
  onUploadSuccess: () => void;
}

type StepType = 'upload' | 'parsing' | 'preview' | 'importing' | 'success';

// Dynamically loads the SheetJS library from CDN
const loadXlsx = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).XLSX) {
      resolve((window as any).XLSX);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => {
      resolve((window as any).XLSX);
    };
    script.onerror = () => reject(new Error("Failed to load Excel parser engine from CDN."));
    document.body.appendChild(script);
  });
};

const downloadCsvTemplate = () => {
  const headers = ['Category', 'Item Name', 'Price', 'Type (Veg/Non-Veg)', 'Description', 'Options & Add-ons'];
  const rows = [
    ['Starters', 'Paneer Tikka', '220', 'Veg', 'Clay oven grilled cottage cheese marinated in spices', 'Sizes (Required): Half (0, Default), Full (100) | Add-ons: Extra Chutney (10), Extra Salad (20)'],
    ['Starters', 'Chicken Seekh Kebab', '260', 'Non-Veg', 'Spicy minced chicken skewers cooked in tandoor', 'Sizes (Required): Half (0, Default), Full (120)'],
    ['Main Course', 'Veg Biryani', '240', 'Veg', 'Basmati rice cooked with mixed vegetables and aromatic herbs', 'Add-ons: Extra Raita (20), Extra Salan (30)'],
    ['Main Course', 'Butter Chicken', '320', 'Non-Veg', 'Tender chicken pieces cooked in a rich, buttery tomato gravy', 'Portion (Required): Regular (0, Default), Large (150)']
  ];
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'hivago_menu_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadExcelTemplate = async () => {
  try {
    const XLSX = await loadXlsx();
    const headers = ['Category', 'Item Name', 'Price', 'Type (Veg/Non-Veg)', 'Description', 'Options & Add-ons'];
    const data = [
      headers,
      ['Starters', 'Paneer Tikka', 220, 'Veg', 'Clay oven grilled cottage cheese marinated in spices', 'Sizes (Required): Half (0, Default), Full (100) | Add-ons: Extra Chutney (10), Extra Salad (20)'],
      ['Starters', 'Chicken Seekh Kebab', 260, 'Non-Veg', 'Spicy minced chicken skewers cooked in tandoor', 'Sizes (Required): Half (0, Default), Full (120)'],
      ['Main Course', 'Veg Biryani', 240, 'Veg', 'Basmati rice cooked with mixed vegetables and aromatic herbs', 'Add-ons: Extra Raita (20), Extra Salan (30)'],
      ['Main Course', 'Butter Chicken', 320, 'Non-Veg', 'Tender chicken pieces cooked in a rich, buttery tomato gravy', 'Portion (Required): Regular (0, Default), Large (150)']
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Menu Template');
    XLSX.writeFile(wb, 'hivago_menu_template.xlsx');
  } catch (err) {
    console.error("Failed to generate Excel template:", err);
    downloadCsvTemplate(); // fallback
  }
};

const parseOptionsString = (optionsStr: string): MenuItemOptionGroup[] => {
  if (!optionsStr || !optionsStr.trim()) return [];
  
  const groups: MenuItemOptionGroup[] = [];
  
  // Split groups by "|"
  const rawGroups = optionsStr.split('|');
  rawGroups.forEach((groupPart, groupIdx) => {
    const colonIdx = groupPart.indexOf(':');
    if (colonIdx === -1) return;
    
    const groupNameRaw = groupPart.substring(0, colonIdx).trim();
    const optionsListRaw = groupPart.substring(colonIdx + 1).trim();
    
    // Check if group is required: e.g. "Sizes (Required)" or just "Sizes"
    const isRequired = groupNameRaw.toLowerCase().includes('required') || groupNameRaw.toLowerCase().includes('select 1');
    const cleanGroupName = groupNameRaw.replace(/\(.*\)/g, '').trim();
    
    const options: MenuItemOption[] = [];
    
    // Split options by ","
    const rawOptions = optionsListRaw.split(',');
    rawOptions.forEach(optPart => {
      // Matches "Name (Price, Default)" or "Name (Price)" or "Name"
      const match = optPart.match(/^(.+?)(?:\s*\(([^)]+)\))?$/);
      if (!match) return;
      
      const name = match[1].trim();
      if (!name) return;
      
      const details = match[2] ? match[2].split(',') : [];
      
      let price = 0;
      let isDefault = false;
      
      details.forEach(detail => {
        const d = detail.trim().toLowerCase();
        if (d === 'default' || d === 'def' || d === 'yes' || d === 'true') {
          isDefault = true;
        } else {
          // Parse price
          price = parseFloat(d.replace(/[^0-9.]/g, '')) || 0;
        }
      });
      
      options.push({
        name,
        type: isRequired ? 'Choice' : 'AddOn',
        additionalPrice: price,
        isDefault
      });
    });
    
    if (options.length > 0) {
      groups.push({
        groupName: cleanGroupName,
        isRequired,
        minSelections: isRequired ? 1 : 0,
        maxSelections: isRequired ? 1 : options.length,
        displayOrder: groupIdx,
        options
      });
    }
  });
  
  return groups;
};

const parseExcelOrCsv = async (file: File): Promise<{ categories: ParsedMenuCategory[], items: ParsedMenuItem[] }> => {
  const XLSX = await loadXlsx();
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rawRows.length === 0) {
    throw new Error("The uploaded spreadsheet is empty.");
  }
  
  let headerIndex = 0;
  let headers: string[] = [];
  
  for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;
    
    const hasKeywords = row.some(cell => {
      if (typeof cell !== 'string' && typeof cell !== 'number') return false;
      const val = String(cell).toLowerCase();
      return val.includes('name') || val.includes('price') || val.includes('category') || val.includes('rate');
    });
    
    if (hasKeywords) {
      headerIndex = r;
      headers = row.map(cell => String(cell ?? '').trim());
      break;
    }
  }
  
  if (headers.length === 0) {
    headers = rawRows[0].map((cell: any) => String(cell ?? '').trim());
    headerIndex = 0;
  }
  
  let categoryIdx = -1;
  let nameIdx = -1;
  let priceIdx = -1;
  let typeIdx = -1;
  let descIdx = -1;
  let optionsIdx = -1;
  
  headers.forEach((header, index) => {
    const h = header.toLowerCase();
    if (h.includes('category') || h.includes('section') || h.includes('group')) {
      categoryIdx = index;
    } else if (h.includes('name') || h.includes('dish') || h.includes('title') || h.includes('item')) {
      nameIdx = index;
    } else if (h.includes('price') || h.includes('rate') || h.includes('cost') || h.includes('amount')) {
      priceIdx = index;
    } else if (h.includes('type') || h.includes('veg') || h.includes('vegetarian')) {
      typeIdx = index;
    } else if (h.includes('description') || h.includes('desc') || h.includes('info') || h.includes('detail')) {
      descIdx = index;
    } else if (h.includes('option') || h.includes('addon') || h.includes('add-on') || h.includes('choice')) {
      optionsIdx = index;
    }
  });
  
  if (nameIdx === -1) nameIdx = 0;
  if (priceIdx === -1 && headers.length > 1) priceIdx = 1;
  if (categoryIdx === -1 && headers.length > 2) categoryIdx = 2;
  if (descIdx === -1 && headers.length > 3) descIdx = 3;
  if (typeIdx === -1 && headers.length > 4) typeIdx = 4;
  if (optionsIdx === -1 && headers.length > 5) optionsIdx = 5;
  
  const items: ParsedMenuItem[] = [];
  const categoriesSet = new Set<string>();
  
  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || !Array.isArray(row) || row.length === 0) continue;
    
    const name = nameIdx !== -1 && row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
    if (!name) continue;
    
    const category = categoryIdx !== -1 && row[categoryIdx] !== undefined ? String(row[categoryIdx]).trim() : 'General';
    const priceStr = priceIdx !== -1 && row[priceIdx] !== undefined ? String(row[priceIdx]).trim() : '0';
    const priceNum = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
    
    const desc = descIdx !== -1 && row[descIdx] !== undefined ? String(row[descIdx]).trim() : '';
    const optionsStr = optionsIdx !== -1 && row[optionsIdx] !== undefined ? String(row[optionsIdx]).trim() : '';
    const optionGroups = parseOptionsString(optionsStr);
    
    let isVeg = true;
    if (typeIdx !== -1 && row[typeIdx] !== undefined) {
      const typeStr = String(row[typeIdx]).trim().toLowerCase();
      if (
        typeStr.includes('non') || 
        typeStr.includes('egg') || 
        typeStr.includes('chicken') || 
        typeStr.includes('meat') || 
        typeStr.includes('fish') || 
        typeStr.includes('beef') || 
        typeStr.includes('pork') || 
        typeStr === 'n' || 
        typeStr === 'no' || 
        typeStr === 'false'
      ) {
        isVeg = false;
      }
    } else {
      const nonVegKeywords = [
        'chicken', 'mutton', 'egg', 'fish', 'prawn', 'shrimp', 'beef', 'pork', 
        'lamb', 'crab', 'duck', 'non-veg', 'nonveg', 'kabab', 'kebab', 'tikka', 'meat'
      ];
      if (nonVegKeywords.some(keyword => name.toLowerCase().includes(keyword))) {
        isVeg = false;
      }
    }
    
    categoriesSet.add(category);
    items.push({
      name,
      description: desc,
      price: priceNum,
      category,
      isVeg,
      optionGroups: optionGroups.length > 0 ? optionGroups : undefined
    });
  }
  
  return {
    categories: Array.from(categoriesSet).map(name => ({ name })),
    items
  };
};

// Dynamically loads the Mozilla PDF.js UMD library and registers the worker via Blob URL to bypass cross-origin restrictions
const loadPdfJs = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
    script.onload = async () => {
      try {
        const pdfjs = (window as any).pdfjsLib;
        // Fetch worker file as a blob and generate local URL to solve same-origin constraints in browser
        const response = await fetch('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        pdfjs.GlobalWorkerOptions.workerSrc = blobUrl;
        resolve(pdfjs);
      } catch (err) {
        console.warn("Failed to load worker via blob URL, trying direct CDN path fallback:", err);
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        resolve(pdfjs);
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF parser engine from CDN."));
    document.body.appendChild(script);
  });
};

// Client-side heuristics menu parser
const parseTextToMenu = (text: string) => {
  const rawLines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const categoriesSet = new Set<string>();
  const items: ParsedMenuItem[] = [];
  let currentCategory = 'General';

  // Common Non-Veg keywords for menus
  const nonVegKeywords = [
    'chicken', 'mutton', 'egg', 'fish', 'prawn', 'shrimp', 'beef', 'pork', 
    'lamb', 'crab', 'duck', 'non-veg', 'nonveg', 'kabab', 'kebab', 'tikka',
    'meat', 'tandoori chicken', 'butter chicken'
  ];

  // Pre-process: combine lines where the name is on one line and the price is alone on the next line
  const lines: string[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const current = rawLines[i];
    const next = rawLines[i + 1];
    
    // Checks if the next line is purely a price representation
    const isNextPriceOnly = next && /^(?:rs\.?|inr|₹)?\s*\d+(?:\.\d{1,2})?\s*(?:\/-|only|rs)?$/i.test(next.trim());
    const doesCurrentHaveNoDigits = !/\d/.test(current);
    
    if (isNextPriceOnly && doesCurrentHaveNoDigits && current.length > 2 && current.length < 50) {
      lines.push(`${current} - ${next}`);
      i++; // Skip the next line
    } else {
      lines.push(current);
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Check if line looks like a category header
    // Criteria: All uppercase, short, no numbers, not just spaces/dots
    const isUpper = line.toUpperCase() === line;
    const isShort = line.length > 2 && line.length < 25;
    const hasNoDigits = !/\d/.test(line);
    const hasNoDots = !line.includes('...');
    const isCategoryHeader = isUpper && isShort && hasNoDigits && hasNoDots;

    if (isCategoryHeader) {
      currentCategory = line.charAt(0) + line.slice(1).toLowerCase();
      categoriesSet.add(currentCategory);
      continue;
    }

    // 2. Check for item name and price at the end: "Paneer Tikka .... 220" or "Paneer Tikka - 220"
    const priceAtEndMatch = line.match(/^(.+?)(?:\.{2,}|-|\s+)(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/-|rs|only)?\s*$/i);
    
    // 3. Check for item price at the start: "220 Paneer Tikka"
    const priceAtStartMatch = line.match(/^(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d{1,2})?)\s*(?:\/-)?\s+(.+)$/i);

    if (priceAtEndMatch) {
      const name = priceAtEndMatch[1].replace(/[\.\-\s]+$/, '').trim();
      const price = parseFloat(priceAtEndMatch[2]);
      
      if (name.length > 2 && !/^\d/.test(name)) {
        // Look ahead for description on the next line
        let description = '';
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextHasPrice = /\d/.test(nextLine);
          const nextIsUpper = nextLine.toUpperCase() === nextLine;
          const nextIsShort = nextLine.length < 25;
          
          if (!nextHasPrice && (!nextIsUpper || !nextIsShort) && nextLine.length > 8 && !nextLine.includes('...')) {
            description = nextLine;
            i++; // Skip the next line as it's the description
          }
        }

        // Determine vegetarian status
        const isVeg = !nonVegKeywords.some(keyword => name.toLowerCase().includes(keyword));

        categoriesSet.add(currentCategory);
        items.push({
          name,
          description,
          price,
          category: currentCategory,
          isVeg
        });
      }
    } else if (priceAtStartMatch) {
      const price = parseFloat(priceAtStartMatch[1]);
      const name = priceAtStartMatch[2].trim();
      
      if (name.length > 2 && !/^\d/.test(name)) {
        // Look ahead for description on the next line
        let description = '';
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextHasPrice = /\d/.test(nextLine);
          const nextIsUpper = nextLine.toUpperCase() === nextLine;
          const nextIsShort = nextLine.length < 25;
          
          if (!nextHasPrice && (!nextIsUpper || !nextIsShort) && nextLine.length > 8 && !nextLine.includes('...')) {
            description = nextLine;
            i++;
          }
        }

        const isVeg = !nonVegKeywords.some(keyword => name.toLowerCase().includes(keyword));

        categoriesSet.add(currentCategory);
        items.push({
          name,
          description,
          price,
          category: currentCategory,
          isVeg
        });
      }
    }
  }

  if (categoriesSet.size === 0) {
    categoriesSet.add('General');
  }

  return {
    categories: Array.from(categoriesSet).map(name => ({ name })),
    items
  };
};



const MOCK_MENU = {
  categories: [
    { name: 'Starters' },
    { name: 'Main Course' },
    { name: 'Desserts' },
    { name: 'Beverages' }
  ],
  items: [
    { name: 'Paneer Tikka', description: 'Clay oven grilled cottage cheese marinated in spices', price: 220, category: 'Starters', isVeg: true },
    { name: 'Chicken Seekh Kebab', description: 'Spicy minced chicken skewers cooked in tandoor', price: 260, category: 'Starters', isVeg: false },
    { name: 'Veg Biryani', description: 'Basmati rice cooked with mixed vegetables and aromatic herbs', price: 240, category: 'Main Course', isVeg: true },
    { name: 'Butter Chicken', description: 'Tender chicken pieces cooked in a rich, buttery tomato gravy', price: 320, category: 'Main Course', isVeg: false },
    { name: 'Dal Makhani', description: 'Black lentils slow cooked overnight with butter and cream', price: 180, category: 'Main Course', isVeg: true },
    { name: 'Gulab Jamun', description: 'Warm milk dumplings soaked in sugar syrup', price: 90, category: 'Desserts', isVeg: true },
    { name: 'Chocolate Brownie', description: 'Fudgy chocolate brownie served warm', price: 140, category: 'Desserts', isVeg: true },
    { name: 'Masala Chai', description: 'Spiced Indian tea brewed with milk and herbs', price: 40, category: 'Beverages', isVeg: true }
  ]
};

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  categories, 
  existingItems = [],
  onUploadSuccess 
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<StepType>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedCategories, setParsedCategories] = useState<ParsedMenuCategory[]>([]);
  const [parsedItems, setParsedItems] = useState<ParsedMenuItem[]>([]);
  const [importStatusText, setImportStatusText] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingNameSet = useMemo(() => {
    return new Set((existingItems || []).map(i => i.name.trim().toLowerCase()));
  }, [existingItems]);

  if (!isOpen) return null;

  const isValidFileType = (file: File): boolean => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'xlsx', 'xls', 'csv'];
    const validMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    return validExts.includes(ext || '') || validMimes.includes(file.type);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
      } else {
        showToast("Please upload a PDF, Excel, or CSV file", "error");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
      } else {
        showToast("Please upload a PDF, Excel, or CSV file", "error");
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleParseFile = async () => {
    if (!selectedFile) return;
    setStep('parsing');
    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      let parsedData;

      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        showToast("Reading spreadsheet menu data...", "info");
        parsedData = await parseExcelOrCsv(selectedFile);
      } else {
        // 1. Read PDF as ArrayBuffer
        const arrayBuffer = await selectedFile.arrayBuffer();
        
        // 2. Load PDF.js engine from CDN
        const pdfjs = await loadPdfJs();
        
        // 3. Load the document
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        // 4. Extract text content from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' \n ');
            
          fullText += pageText + ' \n ';
        }
        
        // 5. Parse the extracted text (heuristics)
        parsedData = parseTextToMenu(fullText);
      }
      
      if (parsedData.items.length > 0) {
        setParsedCategories(parsedData.categories);
        setParsedItems(parsedData.items);
        setStep('preview');
        showToast(`Menu parsed successfully! Found ${parsedData.items.length} items.`, "success");
      } else {
        throw new Error("No menu items could be automatically identified from the file.");
      }
    } catch (err: any) {
      console.error("File parsing failed:", err);
      showToast(err.message || "Failed to parse file. Loading sample template.", "warning");
      setParsedCategories(MOCK_MENU.categories);
      setParsedItems(MOCK_MENU.items);
      setStep('preview');
    }
  };

  const handleItemChange = (index: number, field: keyof ParsedMenuItem, value: any) => {
    setParsedItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleDeleteItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    const defaultCategory = parsedCategories[0]?.name || categories[0]?.name || 'Starters';
    setParsedItems(prev => [
      ...prev,
      {
        name: '',
        description: '',
        price: 0,
        category: defaultCategory,
        isVeg: true
      }
    ]);
  };

  const handleExportParsedToExcel = async () => {
    try {
      const XLSX = await loadXlsx();
      const headers = ['Category', 'Item Name', 'Price', 'Type (Veg/Non-Veg)', 'Description', 'Options & Add-ons'];
      
      const rows = parsedItems.map(item => {
        let optionsStr = '';
        if (item.optionGroups && item.optionGroups.length > 0) {
          optionsStr = item.optionGroups.map(group => {
            const optionsPart = group.options.map(opt => {
              const details = [
                opt.additionalPrice,
                opt.isDefault ? 'Default' : ''
              ].filter(Boolean).join(', ');
              return `${opt.name} (${details})`;
            }).join(', ');
            return `${group.groupName} (${group.isRequired ? 'Required' : 'Optional'}): ${optionsPart}`;
          }).join(' | ');
        }
        
        return [
          item.category,
          item.name,
          item.price,
          item.isVeg ? 'Veg' : 'Non-Veg',
          item.description || '',
          optionsStr
        ];
      });
      
      const data = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Parsed PDF Menu');
      XLSX.writeFile(wb, `${selectedFile?.name.replace(/\.[^/.]+$/, "") || 'parsed_menu'}_exported.xlsx`);
      showToast("Parsed menu exported to Excel successfully!", "success");
    } catch (err) {
      console.error("Failed to export to Excel:", err);
      showToast("Failed to export to Excel.", "error");
    }
  };

  const validateItems = (): boolean => {
    for (const item of parsedItems) {
      if (!item.name.trim()) return false;
      if (!item.category.trim()) return false;
      if (isNaN(item.price) || item.price < 0) return false;
    }
    return true;
  };

  const handleImportConfirm = async () => {
    if (!validateItems()) {
      showToast("Please ensure all items have valid names, categories, and prices (>= 0).", "error");
      return;
    }

    // Filter out duplicate items (checking existing menu items and duplicates within CSV)
    const seenInImport = new Set<string>();
    const uniqueItemsToImport: ParsedMenuItem[] = [];
    let duplicateCount = 0;

    for (const item of parsedItems) {
      const nameKey = item.name.trim().toLowerCase();
      if (!nameKey) continue;

      if (existingNameSet.has(nameKey) || seenInImport.has(nameKey)) {
        duplicateCount++;
      } else {
        seenInImport.add(nameKey);
        uniqueItemsToImport.push(item);
      }
    }

    if (uniqueItemsToImport.length === 0) {
      showToast(`All ${parsedItems.length} item(s) in the file already exist in your menu. No new items were imported.`, "warning");
      return;
    }

    if (duplicateCount > 0) {
      showToast(`Skipped ${duplicateCount} duplicate item(s) already present in your menu. Importing ${uniqueItemsToImport.length} new item(s).`, "info");
    }

    setStep('importing');
    setImportStatusText(`Importing ${uniqueItemsToImport.length} new item(s)...`);

    try {
      // Try using the new bulk-import API endpoint
      const uniqueCats = Array.from(new Set(uniqueItemsToImport.map(i => i.category.trim()))).map(name => ({ name }));
      await bulkImportMenu({
        categories: uniqueCats,
        items: uniqueItemsToImport
      });
      
      setStep('success');
      onUploadSuccess();
      showToast(`Menu imported successfully! Added ${uniqueItemsToImport.length} new items.`, "success");
    } catch (err: any) {
      // Check if endpoint is not implemented (404/405/501)
      const isUnimplemented = err.response?.status === 404 || err.response?.status === 405 || err.response?.status === 501;
      
      if (isUnimplemented || err.message?.includes("Network Error") || err.message?.includes("404")) {
        console.log("Bulk import endpoint not active. Falling back to sequential APIs.");
        try {
          // Fallback sequential execution
          const uniqueCategoryNames = Array.from(new Set(uniqueItemsToImport.map(item => item.category.trim()))).filter(Boolean);
          const categoryMap: Record<string, string> = {};

          // Map existing categories to avoid duplicates
          categories.forEach(c => {
            categoryMap[c.name.toLowerCase()] = c.id;
          });

          // 1. Create missing categories
          for (const catName of uniqueCategoryNames) {
            const lowerName = catName.toLowerCase();
            if (!categoryMap[lowerName]) {
              setImportStatusText(`Creating category "${catName}"...`);
              const newCat = await createMenuCategory(catName);
              categoryMap[lowerName] = newCat.id || (newCat as any).menuId;
            }
          }

          // 2. Create items
          for (let i = 0; i < uniqueItemsToImport.length; i++) {
            const item = uniqueItemsToImport[i];
            setImportStatusText(`Adding item "${item.name}" (${i + 1}/${uniqueItemsToImport.length})...`);
            const catId = categoryMap[item.category.trim().toLowerCase()];

            await createMenuItem({
              menuId: catId,
              name: item.name,
              description: item.description || undefined,
              basePrice: Number(item.price) || 0,
              isVegetarian: item.isVeg,
              displayOrder: i,
              preparationTimeMinutes: 15,
              optionGroups: item.optionGroups
            });
          }

          setStep('success');
          onUploadSuccess();
          showToast(`Menu imported successfully! Added ${uniqueItemsToImport.length} new items.`, "success");
        } catch (fallbackErr: any) {
          console.error("Fallback sequential import failed:", fallbackErr);
          setStep('preview');
          showToast(fallbackErr.response?.data?.message || fallbackErr.message || "Import failed. Please try again.", "error");
        }
      } else {
        console.error("Bulk import failed:", err);
        setStep('preview');
        showToast(err.response?.data?.message || err.message || "Import failed. Please try again.", "error");
      }
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedCategories([]);
    setParsedItems([]);
    setStep('upload');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-5xl overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-8 py-5 shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Bulk Upload Menu</h2>
            <p className="text-xs font-semibold text-slate-400">Upload a PDF, Excel, or CSV menu file, verify the preview table, and add items in bulk</p>
          </div>
          <button 
            onClick={onClose}
            className="group flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-all hover:bg-red-50 hover:text-red-500"
          >
            <span className="text-lg font-bold transition-transform group-hover:rotate-90">✕</span>
          </button>
        </div>

        {/* Content Box */}
        <div className="overflow-y-auto px-8 py-6 flex-1 custom-scrollbar">
          
          {/* STEP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-10">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`w-full max-w-xl aspect-[16/9] flex flex-col items-center justify-center border-3 border-dashed rounded-[24px] cursor-pointer transition-all p-6 text-center ${
                  dragActive 
                    ? 'border-brand-600 bg-brand-50/50 shadow-inner' 
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.csv,.xlsx,.xls,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  className="hidden"
                />
                
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm mb-4">
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                {selectedFile ? (
                  <div>
                    <p className="text-base font-bold text-slate-800">{selectedFile.name}</p>
                    <p className="text-xs font-semibold text-slate-400 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.name.split('.').pop()?.toUpperCase()} Document
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-base font-bold text-slate-700">Drag & drop your PDF, Excel, or CSV menu file here</p>
                    <p className="text-xs font-semibold text-slate-400 mt-1">or click to browse from files</p>
                  </div>
                )}
              </div>

              {selectedFile && (
                <button
                  onClick={handleParseFile}
                  className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-red-100 transition-all hover:bg-brand-700 active:scale-95"
                >
                  <svg className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Analyze & Parse Menu File
                </button>
              )}



              {/* Template Downloads */}
              <div className="w-full max-w-xl mt-4 px-5 py-4 rounded-[24px] bg-slate-50 border border-slate-200/80 flex flex-col gap-3 text-left">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Need a template? Download a pre-formatted menu file:
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={downloadExcelTemplate}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 py-2.5 text-xs font-bold text-slate-700 transition-all active:scale-[0.98]"
                  >
                    📊 Download Excel Template
                  </button>
                  <button
                    type="button"
                    onClick={downloadCsvTemplate}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 hover:border-slate-300 py-2.5 text-xs font-bold text-slate-700 transition-all active:scale-[0.98]"
                  >
                    📄 Download CSV Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PARSING LOADER */}
          {step === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
              <p className="text-base font-bold text-slate-700">Reading PDF & extracting categories and items...</p>
              <p className="text-xs font-semibold text-slate-400">Our system is automatically converting your menu card. This may take up to a minute.</p>
            </div>
          )}

          {/* STEP 3: PREVIEW TABLE */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Preview & Verify Extracted Items</h3>
                  <p className="text-xs font-semibold text-slate-400">Please review names, prices, categories, and types. Double-click any field to edit details.</p>
                </div>
                <button
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 hover:border-brand-500/20 hover:text-brand-600 transition-all"
                >
                  + Add Row
                </button>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-auto max-h-[45vh] shadow-sm bg-white relative custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="sticky top-0 bg-slate-50 z-10 px-6 py-4 w-[20%] border-b border-slate-100">Category</th>
                      <th className="sticky top-0 bg-slate-50 z-10 px-6 py-4 w-[25%] border-b border-slate-100">Item Name</th>
                      <th className="sticky top-0 bg-slate-50 z-10 px-6 py-4 w-[12%] border-b border-slate-100">Price (₹)</th>
                      <th className="sticky top-0 bg-slate-50 z-10 px-6 py-4 w-[15%] border-b border-slate-100">Type</th>
                      <th className="sticky top-0 bg-slate-50 z-10 px-6 py-4 border-b border-slate-100">Description</th>
                      <th className="sticky top-0 bg-slate-50 z-10 px-6 py-4 text-right w-[8%] border-b border-slate-100">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.map((item, idx) => {
                      const isNameEmpty = !item.name.trim();
                      const isCatEmpty = !item.category.trim();
                      const isPriceInvalid = isNaN(item.price) || item.price < 0;

                      return (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-sm text-slate-700">
                          {/* Category input */}
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={item.category}
                              onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                              className={`w-full rounded-lg border-2 px-3 py-1.5 font-semibold text-xs outline-none focus:border-brand-500/20 focus:bg-white ${
                                isCatEmpty ? 'border-red-300 bg-red-50 text-red-700' : 'border-transparent bg-transparent'
                              }`}
                              placeholder="e.g. Starters"
                            />
                          </td>
                          {/* Item Name input */}
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                              className={`w-full rounded-lg border-2 px-3 py-1.5 font-semibold text-xs outline-none focus:border-brand-500/20 focus:bg-white ${
                                isNameEmpty ? 'border-red-300 bg-red-50 text-red-700' : 'border-transparent bg-transparent'
                              }`}
                              placeholder="e.g. Paneer Tikka"
                            />
                          </td>
                          {/* Price input */}
                          <td className="px-6 py-3">
                            <input
                              type="number"
                              value={isNaN(item.price) ? '' : item.price}
                              onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value))}
                              className={`w-full rounded-lg border-2 px-3 py-1.5 font-bold text-xs outline-none focus:border-brand-500/20 focus:bg-white ${
                                isPriceInvalid ? 'border-red-300 bg-red-50 text-red-700' : 'border-transparent bg-transparent'
                              }`}
                              placeholder="Price"
                            />
                          </td>
                          {/* Veg/Non-veg toggle */}
                          <td className="px-6 py-3">
                            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-100 w-full max-w-[120px]">
                              <button
                                type="button"
                                onClick={() => handleItemChange(idx, 'isVeg', true)}
                                className={`flex-1 text-[9px] font-bold py-1.5 rounded transition-all ${
                                  item.isVeg ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                VEG
                              </button>
                              <button
                                type="button"
                                onClick={() => handleItemChange(idx, 'isVeg', false)}
                                className={`flex-1 text-[9px] font-bold py-1.5 rounded transition-all ${
                                  !item.isVeg ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                NON
                              </button>
                            </div>
                          </td>
                          {/* Description input */}
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={item.description || ''}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              className="w-full rounded-lg border border-transparent px-3 py-1.5 font-medium text-xs bg-transparent outline-none focus:border-brand-500/20 focus:bg-white placeholder:text-slate-300"
                              placeholder="Describe this delicious dish..."
                            />
                          </td>
                          {/* Action button */}
                          <td className="px-6 py-3 text-right">
                            <button
                              onClick={() => handleDeleteItem(idx)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {parsedItems.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-sm font-bold text-slate-400">No items in the list. Click "+ Add Row" or re-upload a PDF.</p>
                </div>
              )}

              <div className="flex justify-between items-center shrink-0 pt-4 border-t border-slate-100">
                <button
                  onClick={handleReset}
                  className="rounded-2xl bg-slate-50 border border-slate-200 px-6 py-3.5 text-xs font-bold text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
                >
                  Upload New File
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleExportParsedToExcel}
                    className="rounded-2xl bg-emerald-50 border border-emerald-200 px-6 py-3.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    📥 Export to Excel
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-2xl bg-white border border-slate-200 px-6 py-3.5 text-xs font-bold text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportConfirm}
                    disabled={parsedItems.length === 0}
                    className="rounded-2xl bg-brand-600 px-6 py-3.5 text-xs font-bold text-white shadow-xl shadow-red-100 hover:bg-brand-700 disabled:opacity-50 active:scale-95 transition-all"
                  >
                    Confirm & Add {parsedItems.length} Items
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: IMPORTING */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
              <p className="text-base font-bold text-slate-700">{importStatusText}</p>
              <p className="text-xs font-semibold text-slate-400">Uploading items to your categories. Do not close this window.</p>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Import Completed Successfully!</h3>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-8">
                All categories and menu items have been successfully loaded and saved to your menu tab.
              </p>
              <button
                onClick={onClose}
                className="bg-brand-600 text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-brand-700 shadow-xl shadow-red-100 transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
