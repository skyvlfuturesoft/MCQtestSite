import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, API_URL } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Plus, Trash2, Check, Upload, X, AlertCircle, Save, Smartphone, RefreshCw, QrCode, Download, FileSpreadsheet, FileText, HelpCircle, CheckCircle } from 'lucide-react';
import '../../app.css';

export default function CreateExam() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { examId } = useParams();
  const isEditMode = !!examId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState([
    { question_text: '', question_type: 'mcq', image_url: '', options: ['', '', '', ''], correct_answer: 0, accepted_answers: [''], marks: 1 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [loadingExam, setLoadingExam] = useState(false);
  const [error, setError] = useState('');
  const [uploadingIdx, setUploadingIdx] = useState(null);

  // QR Modal and Real-time Sync states
  const [showQRModal, setShowQRModal] = useState(false);
  const [hasRemoteChanges, setHasRemoteChanges] = useState(false);

  // Import Modal & Template states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState('upload'); // 'upload' | 'paste' | 'guide'
  const [pastedText, setPastedText] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [importStatusMsg, setImportStatusMsg] = useState('');

  const downloadSampleCSV = () => {
    const csvContent =
      'Question,Option A,Option B,Option C,Option D,Correct Option,Marks\n' +
      '"What is the capital of France?","London","Paris","Berlin","Madrid","B",1\n' +
      '"Which planet is known as the Red Planet?","Earth","Mars","Jupiter","Venus","B",1\n' +
      '"What is 12 multiplied by 8?","84","96","108","92","B",2\n' +
      '"Which element has the chemical symbol H?","Helium","Hydrogen","Carbon","Oxygen","B",1\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_mcq_questions.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleExcel = async () => {
    try {
      let XLSXLib = window.XLSX;
      if (!XLSXLib) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Excel library'));
          document.head.appendChild(script);
        });
        XLSXLib = window.XLSX;
      }
      const data = [
        ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Option', 'Marks'],
        ['What is the capital of France?', 'London', 'Paris', 'Berlin', 'Madrid', 'B', 1],
        ['Which planet is known as the Red Planet?', 'Earth', 'Mars', 'Jupiter', 'Venus', 'B', 1],
        ['What is 12 multiplied by 8?', '84', '96', '108', '92', 'B', 2],
        ['Which element has the chemical symbol H?', 'Helium', 'Hydrogen', 'Carbon', 'Oxygen', 'B', 1]
      ];
      const worksheet = XLSXLib.utils.aoa_to_sheet(data);
      const workbook = XLSXLib.utils.book_new();
      XLSXLib.utils.book_append_sheet(workbook, worksheet, 'MCQ Questions');
      XLSXLib.writeFile(workbook, 'sample_mcq_questions.xlsx');
    } catch (err) {
      downloadSampleCSV();
    }
  };

  const downloadSamplePDF = async () => {
    try {
      let jsPDFLib = window.jspdf?.jsPDF;
      if (!jsPDFLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load PDF generation library'));
          document.head.appendChild(script);
        });
        jsPDFLib = window.jspdf.jsPDF;
      }

      const doc = new jsPDFLib();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Sample MCQ Questions for Online Exam', 14, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Upload this formatted PDF directly to import questions automatically.', 14, 28);

      const content = [
        'Question 1: What is the capital of France?',
        'A) London',
        'B) Paris',
        'C) Berlin',
        'D) Madrid',
        'Ans: B',
        'Marks: 1',
        '',
        'Question 2: Consider the following code snippet:',
        'int x = 15;',
        'int y = 25;',
        'What is the output of System.out.println(x + y)?',
        'A) 1525',
        'B) 40',
        'C) 375',
        'D) Error',
        'Ans: B',
        'Marks: 2',
        '',
        'Question 3: Which planet is known as the Red Planet?',
        'A) Earth',
        'B) Mars',
        'C) Jupiter',
        'D) Venus',
        'Ans: B',
        'Marks: 1',
      ];

      let y = 38;
      content.forEach((line) => {
        if (line.startsWith('Question')) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(15, 23, 42);
        } else if (line.startsWith('Ans:')) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(5, 150, 105);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(51, 65, 85);
        }
        doc.text(line, 14, y);
        y += 6;
      });

      doc.save('sample_mcq_questions.pdf');
    } catch (err) {
      alert('Could not download sample PDF: ' + err.message);
    }
  };

  const parseCSVLine = (str) => {
    const arr = [];
    let quote = false;
    let col = '';
    for (let i = 0; i < str.length; i++) {
      const cc = str[i];
      if (cc === '"') {
        quote = !quote;
      } else if (cc === ',' && !quote) {
        arr.push(col.trim().replace(/^"|"$/g, ''));
        col = '';
      } else {
        col += cc;
      }
    }
    arr.push(col.trim().replace(/^"|"$/g, ''));
    return arr;
  };

  const parseTextToQuestions = (rawText) => {
    if (!rawText) return [];
    const questionsList = [];

    // Pre-split text into question blocks matching 1. [Topic], Q1., Question 1:, "1. [Topic]..."
    const blocks = rawText.split(/(?=(?:(?:^|\s+)"?Q(?:uestion)?\s*\d+[\.:\)]|(?:^|\n|\r)\s*"?\d+[\.:\)]\s+[A-Z\[]))/gi);

    for (const block of blocks) {
      let trimmed = block.trim();
      if (!trimmed) continue;

      // Strip quotes around block or lines
      trimmed = trimmed.replace(/^"|"$/g, '').trim();

      // Extract Question text: everything between header 1. and Option A
      const qMatch = trimmed.match(/^(?:Q(?:uestion)?\s*\d+[\.:\)]|"?\d+[\.:\)]"?)\s*(.*?)(?=\s*(?:["]?A[\)\.:]|[\(]A[\)]|Option\s*A[\.:]?))/is);
      let question_text = qMatch ? qMatch[1].trim() : '';

      // Fallback: If no Option A tag is matched, check first line
      if (!question_text) {
        const firstLine = trimmed.split('\n')[0] || '';
        question_text = firstLine.replace(/^(?:Q(?:uestion)?\s*\d+[\.:\)]|"?\d+[\.:\)]"?)\s*/i, '').trim();
      }

      // Clean quiz title preamble or header clutter if present
      question_text = question_text
        .replace(/^APTITUDE\s+PRACTICE\s+QUIZ\s*/i, '')
        .replace(/^\d+\s+Random\s+Multiple-Choice\s+Questions\s+with\s+Answers\s*/i, '')
        .replace(/^.*?-\s*\d+\s*MCQs\s*with\s*Answers\s*/i, '')
        .replace(/"/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Extract Option A
      const optAMatch = trimmed.match(/(?:["]?A[\)\.:]|[\(]A[\)]|Option\s*A[\.:]?)\s*(.*?)(?=\s*(?:["]?B[\)\.:]|[\(]B[\)]|Option\s*B[\.:]?))/is);
      let optA = optAMatch ? optAMatch[1].trim() : '';

      // Extract Option B
      const optBMatch = trimmed.match(/(?:["]?B[\)\.:]|[\(]B[\)]|Option\s*B[\.:]?)\s*(.*?)(?=\s*(?:["]?C[\)\.:]|[\(]C[\)]|Option\s*C[\.:]?))/is);
      let optB = optBMatch ? optBMatch[1].trim() : '';

      // Extract Option C
      const optCMatch = trimmed.match(/(?:["]?C[\)\.:]|[\(]C[\)]|Option\s*C[\.:]?)\s*(.*?)(?=\s*(?:["]?D[\)\.:]|[\(]D[\)]|Option\s*D[\.:]?))/is);
      let optC = optCMatch ? optCMatch[1].trim() : '';

      // Extract Option D
      const optDMatch = trimmed.match(/(?:["]?D[\)\.:]|[\(]D[\)]|Option\s*D[\.:]?)\s*(.*?)(?=\s*(?:["]?Ans|Answer|Correct|Marks|$))/is);
      let optD = optDMatch ? optDMatch[1].trim() : '';

      // Clean quotes & multi-line noise from options
      optA = optA.replace(/^"|"$/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      optB = optB.replace(/^"|"$/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      optC = optC.replace(/^"|"$/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      optD = optD.replace(/^"|"$/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

      // Extract Correct Answer
      const ansMatch = trimmed.match(/(?:Ans|Answer|Correct)[\.:\-]?\s*(.*?)(?=\s*(?:Marks|$))/is);
      let correct_answer = 0;
      if (ansMatch) {
        const ansStr = ansMatch[1].trim().toUpperCase();
        if (/\bB\b|OPTION\s*B|2/i.test(ansStr)) correct_answer = 1;
        else if (/\bC\b|OPTION\s*C|3/i.test(ansStr)) correct_answer = 2;
        else if (/\bD\b|OPTION\s*D|4/i.test(ansStr)) correct_answer = 3;
        else if (/\bA\b|OPTION\s*A|1/i.test(ansStr)) correct_answer = 0;
      }

      // Extract Marks
      const marksMatch = trimmed.match(/Marks[\.:\-]?\s*(\d+)/i);
      const marks = marksMatch ? parseInt(marksMatch[1]) : 1;

      // Only add valid questions that have text and at least 2 options
      if (question_text && (optA || optB)) {
        questionsList.push({
          question_text,
          question_type: 'mcq',
          image_url: '',
          options: [
            optA || 'Option A',
            optB || 'Option B',
            optC || 'Option C',
            optD || 'Option D'
          ],
          correct_answer,
          accepted_answers: [''],
          marks
        });
      }
    }

    return questionsList;
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv' || ext === 'txt') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        const lines = text.split('\n');
        const importedQuestions = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          if (i === 0 && line.toLowerCase().includes('question')) continue; // skip header

          const parts = parseCSVLine(line);
          if (parts.length >= 5) {
            const question_text = parts[0];
            const options = [
              parts[1] || 'Option A',
              parts[2] || 'Option B',
              parts[3] || 'Option C',
              parts[4] || 'Option D'
            ];

            let correct_answer = 0;
            if (parts.length >= 6) {
              const correctVal = parts[5].toUpperCase();
              if (correctVal === 'B' || correctVal === '1' || correctVal === 'OPTION B') correct_answer = 1;
              else if (correctVal === 'C' || correctVal === '2' || correctVal === 'OPTION C') correct_answer = 2;
              else if (correctVal === 'D' || correctVal === '3' || correctVal === 'OPTION D') correct_answer = 3;
            }

            const marks = parts.length >= 7 ? parseInt(parts[6]) || 1 : 1;

            if (question_text) {
              importedQuestions.push({
                question_text,
                question_type: 'mcq',
                image_url: '',
                options,
                correct_answer,
                accepted_answers: [''],
                marks
              });
            }
          }
        }

        // If simple CSV line parser didn't find questions, try text block parser
        const finalQuestions = importedQuestions.length > 0 ? importedQuestions : parseTextToQuestions(text);

        if (finalQuestions.length > 0) {
          setParsedQuestions(finalQuestions);
          setImportStatusMsg(`✅ Successfully parsed ${finalQuestions.length} questions from ${file.name}`);
        } else {
          setImportStatusMsg(`❌ Could not parse valid questions from ${file.name}. Please check the format guide.`);
        }
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      try {
        let XLSXLib = window.XLSX;
        if (!XLSXLib) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load Excel parsing library. Check internet connection.'));
            document.head.appendChild(script);
          });
          XLSXLib = window.XLSX;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSXLib.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rows = XLSXLib.utils.sheet_to_json(worksheet, { header: 1 });

            const importedQuestions = [];
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              if (!row || row.length === 0) continue;
              if (i === 0 && String(row[0]).toLowerCase().includes('question')) continue;

              if (row.length >= 5) {
                const question_text = String(row[0] || '').trim();
                const options = [
                  String(row[1] || '').trim(),
                  String(row[2] || '').trim(),
                  String(row[3] || '').trim(),
                  String(row[4] || '').trim()
                ];

                let correct_answer = 0;
                if (row.length >= 6) {
                  const correctVal = String(row[5] || '').trim().toUpperCase();
                  if (correctVal === 'B' || correctVal === '1' || correctVal === 'OPTION B') correct_answer = 1;
                  else if (correctVal === 'C' || correctVal === '2' || correctVal === 'OPTION C') correct_answer = 2;
                  else if (correctVal === 'D' || correctVal === '3' || correctVal === 'OPTION D') correct_answer = 3;
                }

                const marks = row.length >= 7 ? parseInt(row[6]) || 1 : 1;

                if (question_text) {
                  importedQuestions.push({
                    question_text,
                    question_type: 'mcq',
                    image_url: '',
                    options,
                    correct_answer,
                    accepted_answers: [''],
                    marks
                  });
                }
              }
            }

            if (importedQuestions.length > 0) {
              setParsedQuestions(importedQuestions);
              setImportStatusMsg(`✅ Successfully parsed ${importedQuestions.length} questions from Excel!`);
            } else {
              setImportStatusMsg('❌ No valid questions found in Excel file. Check format guide.');
            }
          } catch (excelErr) {
            setImportStatusMsg('Failed to parse Excel file: ' + excelErr.message);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        setImportStatusMsg('Error reading file: ' + err.message);
      }
    } else if (ext === 'pdf') {
      setImportStatusMsg('⌛ Extracting text from PDF document...');
      try {
        let pdfjsLib = window.pdfjsLib;
        if (!pdfjsLib) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load PDF extraction library.'));
            document.head.appendChild(script);
          });
          pdfjsLib = window.pdfjsLib;
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(' ');
          fullText += pageText + '\n';
        }

        const questionsList = parseTextToQuestions(fullText);
        if (questionsList.length > 0) {
          setParsedQuestions(questionsList);
          setImportStatusMsg(`✅ Successfully extracted ${questionsList.length} questions from PDF (${pdf.numPages} pages)!`);
        } else {
          setImportStatusMsg('❌ Could not parse PDF text automatically. Make sure questions follow Q1... A)... B)... Ans: A format or try the "Paste PDF / Raw Text" tab.');
        }
      } catch (pdfErr) {
        setImportStatusMsg('Failed to process PDF: ' + pdfErr.message);
      }
    }
  };

  const handleApplyImportedQuestions = () => {
    if (parsedQuestions.length === 0) return;
    // Replace empty placeholder question if present
    const firstQ = questions[0];
    if (questions.length === 1 && (!firstQ || (!firstQ.question_text && !firstQ.options[0]))) {
      setQuestions(parsedQuestions);
    } else {
      setQuestions((prev) => [...prev, ...parsedQuestions]);
    }
    setShowImportModal(false);
    setParsedQuestions([]);
    setImportStatusMsg('');
    alert(`Successfully added ${parsedQuestions.length} questions to your exam!`);
  };
  useEffect(() => {
    if (isEditMode) {
      const loadExamData = async () => {
        setLoadingExam(true);
        try {
          const examRes = await api(`/api/exams/${examId}`);
          const questionsRes = await api(`/api/exams/${examId}/questions`);
          
          if (examRes.exam) {
            setTitle(examRes.exam.title || '');
            setDescription(examRes.exam.description || '');
            setDuration(examRes.exam.duration || 30);
            setIsPublished(examRes.exam.is_published || false);
          }

          if (questionsRes.questions && questionsRes.questions.length > 0) {
            const mappedQs = questionsRes.questions.map((q) => ({
              id: q.id,
              question_text: q.question_text || '',
              question_type: q.question_type || 'mcq',
              image_url: q.image_url || '',
              options: q.options && q.options.length ? q.options : ['', '', '', ''],
              correct_answer: q.correct_answer !== null && q.correct_answer !== undefined ? q.correct_answer : 0,
              accepted_answers: q.accepted_answers && q.accepted_answers.length ? q.accepted_answers : [''],
              marks: q.marks || 1
            }));
            setQuestions(mappedQs);
          }
        } catch (err) {
          setError(err.message || 'Failed to load exam data');
        } finally {
          setLoadingExam(false);
        }
      };
      loadExamData();
    }
  }, [examId, isEditMode]);

  // Listen to Postgres real-time questions changes for this exam
  useEffect(() => {
    if (!examId) return;

    const channel = supabase
      .channel(`questions-sync-${examId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'questions', filter: `exam_id=eq.${examId}` },
        () => {
          setHasRemoteChanges(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [examId]);

  const handleSyncRemoteChanges = async () => {
    setLoadingExam(true);
    try {
      const questionsRes = await api(`/api/exams/${examId}/questions`);
      if (questionsRes.questions) {
        const mappedQs = questionsRes.questions.map((q) => ({
          id: q.id,
          question_text: q.question_text || '',
          question_type: q.question_type || 'mcq',
          image_url: q.image_url || '',
          options: q.options && q.options.length ? q.options : ['', '', '', ''],
          correct_answer: q.correct_answer !== null && q.correct_answer !== undefined ? q.correct_answer : 0,
          accepted_answers: q.accepted_answers && q.accepted_answers.length ? q.accepted_answers : [''],
          marks: q.marks || 1
        }));
        setQuestions(mappedQs);
      }
      setHasRemoteChanges(false);
    } catch (err) {
      setError('Failed to sync remote changes');
    } finally {
      setLoadingExam(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: '', question_type: 'mcq', image_url: '', options: ['', '', '', ''], correct_answer: 0, accepted_answers: [''], marks: 1 },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (qIdx, field, value) => {
    const updated = [...questions];
    updated[qIdx][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx, optIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const handleAddAcceptedAnswer = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].accepted_answers.push('');
    setQuestions(updated);
  };

  const handleRemoveAcceptedAnswer = (qIdx, ansIdx) => {
    const updated = [...questions];
    if (updated[qIdx].accepted_answers.length === 1) return;
    updated[qIdx].accepted_answers.splice(ansIdx, 1);
    setQuestions(updated);
  };

  const handleAcceptedAnswerChange = (qIdx, ansIdx, value) => {
    const updated = [...questions];
    updated[qIdx].accepted_answers[ansIdx] = value;
    setQuestions(updated);
  };

  // Image Upload and Compression
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              const compressed = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressed);
            },
            'image/jpeg',
            0.7
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e, qIdx) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setUploadingIdx(qIdx);
    try {
      const compressedFile = await compressImage(file);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `questions/${fileName}`;

      const { data, error } = await supabase.storage
        .from('exam-images')
        .upload(filePath, compressedFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('exam-images')
        .getPublicUrl(filePath);

      handleQuestionChange(qIdx, 'image_url', publicUrl);
    } catch (err) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleRemoveImage = (qIdx) => {
    handleQuestionChange(qIdx, 'image_url', '');
  };

  const validateExam = (isPublishingAction) => {
    if (!title.trim()) {
      return 'Exam title cannot be blank.';
    }

    if (questions.length === 0) {
      return 'Exam must contain at least one question.';
    }

    if (isPublishingAction) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const qNum = i + 1;

        if (!q.question_text.trim()) {
          return `Question ${qNum} text cannot be blank.`;
        }

        if (q.question_type === 'mcq' || q.question_type === 'image_mcq') {
          if (q.options.some(opt => !opt.trim())) {
            return `All options must be filled out for Question ${qNum}.`;
          }
          const uniqueOpts = new Set(q.options.map(o => o.trim().toLowerCase()));
          if (uniqueOpts.size < q.options.length) {
            return `Question ${qNum} has duplicate options. All options must be unique.`;
          }
        } else if (q.question_type === 'fill_in_blank' || q.question_type === 'image_fib') {
          if (q.accepted_answers.some(ans => !ans.trim())) {
            return `All accepted answers must be filled out for Question ${qNum}.`;
          }
        }

        if ((q.question_type === 'image_mcq' || q.question_type === 'image_fib') && !q.image_url) {
          return `Question ${qNum} is an Image Question but has no image uploaded.`;
        }
      }
    }

    return null;
  };

  const handleSaveExam = async () => {
    setError('');
    const validationError = validateExam(true);
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      let examIdToUse = examId;

      if (isEditMode) {
        // Update existing exam details
        await api(`/api/exams/${examId}`, {
          method: 'PUT',
          body: { title, description, duration, is_published: true }
        });

        // Delete old questions in single bulk call
        await api(`/api/exams/${examIdToUse}/questions`, { method: 'DELETE' });
      } else {
        // Create a brand new exam only when the admin hits Save
        const examRes = await api('/api/exams', {
          method: 'POST',
          body: { title, description, duration, is_published: true }
        });
        examIdToUse = examRes.exam.id;
      }

      // Map all questions for single bulk insertion
      const questionsToInsert = questions.map((q) => ({
        exam_id: examIdToUse,
        question_text: q.question_text,
        question_type: q.question_type,
        image_url: q.image_url || '',
        options: q.options || [],
        correct_answer: parseInt(q.correct_answer) || 0,
        accepted_answers: q.accepted_answers || [],
        marks: parseInt(q.marks) || 1
      }));

      // Insert all questions in single atomic API request
      await api('/api/questions', {
        method: 'POST',
        body: questionsToInsert
      });

      // Synchronize total_marks on existing attempts for this exam
      const newExamTotalMarks = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 1), 0);
      try {
        await supabase.from('attempts').update({ total_marks: newExamTotalMarks }).eq('exam_id', examIdToUse);
      } catch (_) {}

      alert('Exam saved successfully!');
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Failed to save exam');
    } finally {
      setSubmitting(false);
    }
  };



  if (loadingExam) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  // Generate mobile address for scanning
  const getMobileUrl = () => {
    return window.location.href;
  };

  return (
    <div className="app-container">
      {/* Mobile responsive styling definitions */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 600px) {
          .responsive-grid {
            grid-template-columns: 1fr !important;
          }
          .container {
            padding: 12px !important;
          }
          .dashboard-content {
            padding: 16px !important;
          }
          .form-group-max {
            max-width: 100% !important;
          }
        }
      `}} />

      <div className="container" style={{ paddingBottom: 48 }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/admin')}
          style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="dashboard-content" style={{ maxWidth: 800, margin: '0 auto' }}>
          
          {/* Real-time remote updates sync banner */}
          {hasRemoteChanges && (
            <div style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px',
              borderRadius: 8, color: '#1E40AF', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20
            }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                🔄 Questions updated from phone/another device.
              </span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSyncRemoteChanges}
                style={{ padding: '4px 10px', fontSize: '0.8rem', background: '#3B82F6', boxShadow: 'none' }}
              >
                Sync View
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <h2>{isEditMode ? 'Edit Examination' : 'Create New Examination'}</h2>
              <p style={{ margin: 0 }}>Define exam settings, questions, and publication state</p>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowQRModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--primary)', color: 'var(--primary)', padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <Smartphone size={16} />
              📱 Add from Phone
            </button>
          </div>

          {error && (
            <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5', marginBottom: 24 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => e.preventDefault()}>
            <h3 style={{ marginBottom: 20, borderBottom: '1.5px solid var(--border-light)', paddingBottom: 10 }}>
              Exam Details
            </h3>

            <div className="form-group">
              <label htmlFor="title">Exam Title</label>
              <input
                id="title"
                type="text"
                className="form-input"
                placeholder="e.g., Computer Networks Midterm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="form-input"
                placeholder="Brief description for the students..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                style={{ fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <div className="form-group form-group-max" style={{ maxWidth: 200 }}>
              <label htmlFor="duration">Duration (Minutes)</label>
              <input
                id="duration"
                type="number"
                className="form-input"
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                required
              />
            </div>

            <h3 style={{ marginTop: 40, marginBottom: 20, borderBottom: '1.5px solid var(--border-light)', paddingBottom: 10 }}>
              Question Bank
            </h3>

            {questions.map((q, qIdx) => (
              <div
                key={qIdx}
                style={{
                  padding: 24,
                  border: '1.5px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 24,
                  position: 'relative',
                  background: 'var(--lighter-blue)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h4 style={{ margin: 0, color: 'var(--primary)' }}>Question {qIdx + 1}</h4>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      style={{ background: 'transparent', border: 'none', color: '#C62828', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  )}
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div className="form-group">
                    <label>Question Type</label>
                    <select
                      className="form-select"
                      value={q.question_type}
                      onChange={(e) => handleQuestionChange(qIdx, 'question_type', e.target.value)}
                    >
                      <option value="mcq">MCQ (Multiple Choice)</option>
                      <option value="fill_in_blank">Fill in the Blank</option>
                      <option value="image_mcq">Image + MCQ</option>
                      <option value="image_fib">Image + Fill in the Blank</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Marks</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      value={q.marks}
                      onChange={(e) => handleQuestionChange(qIdx, 'marks', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>

                {/* Image Upload Component Block */}
                {(q.question_type === 'image_mcq' || q.question_type === 'image_fib') && (
                  <div style={{
                    marginBottom: 20, padding: 16, border: '1px dashed var(--border-light)', borderRadius: 6, background: '#FFFFFF'
                  }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.82rem' }}>
                      Question Image Upload
                    </label>
                    {q.image_url ? (
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={q.image_url}
                          alt="Question Preview"
                          style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, border: '1px solid var(--border-light)' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(qIdx)}
                          style={{
                            position: 'absolute', top: 8, right: 8, background: '#EF4444', color: '#FFFFFF',
                            border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Remove Image"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0, fontSize: '0.8rem', padding: '6px 12px' }}>
                          <Upload size={14} />
                          <span>{uploadingIdx === qIdx ? 'Uploading...' : 'Choose Image File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, qIdx)}
                            disabled={uploadingIdx !== null}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>JPG, PNG. Camera photos accepted.</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label>Question Text</label>
                  <textarea
                    className="form-input"
                    placeholder="Enter the question text here..."
                    value={q.question_text}
                    onChange={(e) => handleQuestionChange(qIdx, 'question_text', e.target.value)}
                    rows={2}
                    style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical', minHeight: 60, lineHeight: 1.4 }}
                    required
                  />
                </div>

                {/* MCQ Options Rendering */}
                {(q.question_type === 'mcq' || q.question_type === 'image_mcq') && (
                  <>
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      {q.options.map((option, optIdx) => (
                        <div key={optIdx}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Option {String.fromCharCode(65 + optIdx)}
                          </label>
                          <textarea
                            className="form-input"
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                            value={option}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            rows={2}
                            style={{ width: '100%', fontFamily: 'inherit', resize: 'vertical', minHeight: 48, lineHeight: 1.4 }}
                            required
                          />
                        </div>
                      ))}
                    </div>

                    <div className="form-group form-group-max" style={{ maxWidth: 200 }}>
                      <label>Correct Option</label>
                      <select
                        className="form-select"
                        value={q.correct_answer}
                        onChange={(e) => handleQuestionChange(qIdx, 'correct_answer', parseInt(e.target.value))}
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Fill in the Blank Options Rendering */}
                {(q.question_type === 'fill_in_blank' || q.question_type === 'image_fib') && (
                  <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 12, fontSize: '0.82rem' }}>
                      Accepted Answers (Ignore case automatically)
                    </label>
                    {q.accepted_answers.map((answer, ansIdx) => (
                      <div key={ansIdx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <textarea
                          className="form-input"
                          placeholder={`Accepted Answer Option ${ansIdx + 1}`}
                          value={answer}
                          onChange={(e) => handleAcceptedAnswerChange(qIdx, ansIdx, e.target.value)}
                          rows={1}
                          required
                          style={{ flex: 1, marginBottom: 0, fontFamily: 'inherit', resize: 'vertical', minHeight: 38, lineHeight: 1.4 }}
                        />
                        {q.accepted_answers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAcceptedAnswer(qIdx, ansIdx)}
                            style={{ background: 'transparent', border: 'none', color: '#C62828', cursor: 'pointer' }}
                            title="Remove Answer Option"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleAddAcceptedAnswer(qIdx)}
                      style={{ fontSize: '0.78rem', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}
                    >
                      <Plus size={12} />
                      Add Accepted Value
                    </button>
                  </div>
                )}
              </div>
            ))}

            <div style={{ display: 'flex', gap: 16, marginTop: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddQuestion}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Plus size={16} />
                Add Question
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowImportModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0 }}
              >
                <Download size={16} />
                📥 Import Questions (CSV / Excel / PDF)
              </button>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={submitting}
                  onClick={() => handleSaveExam()}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#22C55E', boxShadow: 'none' }}
                >
                  <Save size={16} />
                  {submitting ? 'Saving...' : 'Save Exam'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Question Import & Format Guide Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: 16
        }}>
          <div style={{
            background: '#FFFFFF', padding: 24, borderRadius: 16, maxWidth: 780, width: '100%',
            maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={() => { setShowImportModal(false); setParsedQuestions([]); setImportStatusMsg(''); }}
              style={{ position: 'absolute', top: 20, right: 20, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
            >
              <X size={22} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Download size={24} style={{ color: 'var(--primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Import Questions & Download Templates</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              Bulk upload questions from CSV, Excel (.xlsx), or PDF/Text files with automatic formatting.
            </p>

            {/* Quick Sample Downloads Bar */}
            <div style={{
              background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1E293B' }}>Download Sample Templates:</div>
                <div style={{ fontSize: '0.78rem', color: '#64748B' }}>Ready-to-fill files with exact headers and formatting</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={downloadSampleCSV}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF' }}
                >
                  <FileText size={14} style={{ color: '#059669' }} />
                  Sample CSV
                </button>
                <button
                  type="button"
                  onClick={downloadSampleExcel}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF' }}
                >
                  <FileSpreadsheet size={14} style={{ color: '#0284C7' }} />
                  Sample Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={downloadSamplePDF}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, background: '#FFFFFF' }}
                >
                  <FileText size={14} style={{ color: '#DC2626' }} />
                  Sample PDF
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: 20, gap: 20 }}>
              <button
                type="button"
                onClick={() => setImportTab('upload')}
                style={{
                  background: 'none', border: 'none', padding: '8px 4px', fontSize: '0.9rem', fontWeight: 600,
                  color: importTab === 'upload' ? 'var(--primary)' : '#64748B',
                  borderBottom: importTab === 'upload' ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                📁 Upload File (CSV / XLSX / PDF)
              </button>
              <button
                type="button"
                onClick={() => setImportTab('paste')}
                style={{
                  background: 'none', border: 'none', padding: '8px 4px', fontSize: '0.9rem', fontWeight: 600,
                  color: importTab === 'paste' ? 'var(--primary)' : '#64748B',
                  borderBottom: importTab === 'paste' ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                📋 Paste PDF / Raw Text
              </button>
              <button
                type="button"
                onClick={() => setImportTab('guide')}
                style={{
                  background: 'none', border: 'none', padding: '8px 4px', fontSize: '0.9rem', fontWeight: 600,
                  color: importTab === 'guide' ? 'var(--primary)' : '#64748B',
                  borderBottom: importTab === 'guide' ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer'
                }}
              >
                📖 Format Guide
              </button>
            </div>

            {/* TAB 1: FILE UPLOAD */}
            {importTab === 'upload' && (
              <div>
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: 32, border: '2px dashed #CBD5E1', borderRadius: 12, background: '#F8FAFC',
                  cursor: 'pointer', textAlign: 'center', marginBottom: 16
                }}>
                  <Upload size={32} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1E293B' }}>Click to select CSV, Excel (.xlsx), or PDF file</span>
                  <span style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 4 }}>Supports .csv, .xlsx, .xls, .pdf, .txt</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf,.txt"
                    onChange={handleFileImport}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}

            {/* TAB 2: PASTE TEXT */}
            {importTab === 'paste' && (
              <div>
                <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: 8 }}>
                  Copy & paste your question list directly from a PDF or Word document:
                </p>
                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`1. What is the speed of light?\nA) 3x10^8 m/s\nB) 3x10^6 m/s\nC) 1500 m/s\nD) 300 m/s\nAns: A\nMarks: 2`}
                  style={{
                    width: '100%', padding: 12, borderRadius: 8, border: '1px solid #CBD5E1',
                    fontFamily: 'monospace', fontSize: '0.85rem', outline: 'none', marginBottom: 12
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    const parsed = parseTextToQuestions(pastedText);
                    if (parsed.length > 0) {
                      setParsedQuestions(parsed);
                      setImportStatusMsg(`✅ Successfully parsed ${parsed.length} questions from text!`);
                    } else {
                      setImportStatusMsg('❌ Could not find valid formatted questions. Check the Format Guide tab.');
                    }
                  }}
                  style={{ fontSize: '0.85rem' }}
                >
                  ⚡ Parse Pasted Text
                </button>
              </div>
            )}

            {/* TAB 3: FORMAT GUIDE */}
            {importTab === 'guide' && (
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#1E293B' }}>📄 PDF Document Sample Structure for 100% Error-Free Upload</h4>
                <div style={{
                  background: '#1E293B', color: '#F8FAFC', padding: 16, borderRadius: 10,
                  fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.82rem', lineHeight: 1.5,
                  marginBottom: 20, overflowX: 'auto', border: '1px solid #334155'
                }}>
                  {`Question 1: What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Ans: B
Marks: 1

Question 2: Which planet is known as the Red Planet?
A) Earth
B) Mars
C) Jupiter
D) Venus
Ans: B
Marks: 1

Question 3: What is 12 multiplied by 8?
A) 84
B) 96
C) 108
D) 92
Ans: B
Marks: 2`}
                </div>

                <div style={{
                  background: '#EFF6FF', border: '1px solid #BFDBFE', padding: 12, borderRadius: 8,
                  fontSize: '0.82rem', color: '#1E40AF', marginBottom: 20
                }}>
                  <strong>📌 Key Rules for PDF Formatting:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                    <li>Start each question with <code>Question 1:</code> or <code>Q1.</code> or <code>1.</code></li>
                    <li>Label options as <code>A)</code>, <code>B)</code>, <code>C)</code>, <code>D)</code> (or <code>A.</code>, <code>B.</code>, etc.)</li>
                    <li>Specify answer using <code>Ans: A</code> (or <code>Ans: Option A</code> / <code>Answer: B</code>)</li>
                    <li>Specify optional marks using <code>Marks: 1</code> (Defaults to 1 if omitted)</li>
                  </ul>
                </div>

                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem' }}>Excel / CSV Column Structure</h4>
                <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px', border: '1px solid #E2E8F0' }}>Col #</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #E2E8F0' }}>Header Name</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #E2E8F0' }}>Required Format / Allowed Values</th>
                        <th style={{ padding: '8px 10px', border: '1px solid #E2E8F0' }}>Sample Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Col 1</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0', fontWeight: 600 }}>Question</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Full question text</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>What is the capital of France?</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Col 2</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0', fontWeight: 600 }}>Option A</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>First option text</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>London</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Col 3</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0', fontWeight: 600 }}>Option B</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Second option text</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Paris</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Col 4</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0', fontWeight: 600 }}>Option C</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Third option text</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Berlin</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Col 5</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0', fontWeight: 600 }}>Option D</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Fourth option text</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Madrid</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Col 6</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0', fontWeight: 600 }}>Correct Option</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>A, B, C, or D (or 1, 2, 3, 4)</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0', color: '#059669', fontWeight: 600 }}>B</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Col 7</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0', fontWeight: 600 }}>Marks</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>Positive integer (Default: 1)</td>
                        <td style={{ padding: '6px 10px', border: '1px solid #E2E8F0' }}>1</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Status Message */}
            {importStatusMsg && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 500,
                background: importStatusMsg.includes('✅') ? '#ECFDF5' : '#FEF2F2',
                color: importStatusMsg.includes('✅') ? '#065F46' : '#991B1B',
                border: importStatusMsg.includes('✅') ? '1px solid #A7F3D0' : '1px solid #FCA5A5',
                marginBottom: 16
              }}>
                {importStatusMsg}
              </div>
            )}

            {/* Parsed Questions Preview & Confirm */}
            {parsedQuestions.length > 0 && (
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16, marginTop: 16 }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#1E293B' }}>
                  Parsed Questions Preview ({parsedQuestions.length} Questions Ready):
                </h4>
                <div style={{ maxHeight: 180, overflowY: 'auto', background: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 16, border: '1px solid #E2E8F0' }}>
                  {parsedQuestions.map((q, idx) => (
                    <div key={idx} style={{ fontSize: '0.82rem', marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>
                      <strong>Q{idx + 1}: {q.question_text}</strong>
                      <div style={{ color: '#64748B', display: 'flex', gap: 12, marginTop: 2 }}>
                        <span>A: {q.options[0]}</span>
                        <span>B: {q.options[1]}</span>
                        <span>C: {q.options[2]}</span>
                        <span>D: {q.options[3]}</span>
                        <span style={{ color: '#059669', fontWeight: 600 }}>Ans: Option {['A','B','C','D'][q.correct_answer]} ({q.marks} m)</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyImportedQuestions}
                  style={{ width: '100%', justifyContent: 'center', background: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <CheckCircle size={18} />
                  Add All {parsedQuestions.length} Questions to Exam
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR Code Scan overlay Modal */}
      {showQRModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, padding: 16
        }}>
          <div style={{
            background: '#FFFFFF', padding: 24, borderRadius: 12, maxWidth: 450, width: '100%',
            position: 'relative', textAlign: 'center', boxShadow: 'var(--shadow-lg)'
          }}>
            <button
              onClick={() => setShowQRModal(false)}
              style={{
                position: 'absolute', top: 16, right: 16, background: 'transparent',
                border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ color: 'var(--primary)', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <QrCode size={40} />
            </div>

            <h3 style={{ margin: '0 0 12px' }}>Edit from your Phone</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
              Scan this QR code with your mobile camera to open this exam builder. You can easily add questions and upload images directly from your phone.
            </p>

            <div style={{
              background: 'var(--lighter-blue)', padding: 16, borderRadius: 8,
              display: 'inline-block', border: '1px solid var(--border-light)', marginBottom: 16
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getMobileUrl())}`}
                alt="QR Code Link"
                style={{ width: 180, height: 180, display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <strong>Tip:</strong> Make sure your PC and phone are connected to the same local Wi-Fi. If using localhost, connect using your machine's LAN IP address.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
