import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Plus, BookOpen, Edit3, Trash2, Download } from 'lucide-react';
import { useAuth } from './AuthContext';
import { JournalCreationWizard } from './JournalCreationWizard';
import { JournalView } from './JournalView';
import { StudentJournalView } from './StudentJournalView';
import { exportJournalToExcel, exportJournalToExcelAdvanced } from '../lib/excel-export';
import { toast } from '../lib/toast';

interface Journal {
  id: string;
  course: string;
  group: string;
  faculty: string;
  subject: string;
  maxScore: number;
  students: Array<{
    name: string;
    scores: number[];
    totalRating: number;
  }>;
  columns: string[];
  createdAt: string;
}

export function JournalSection() {
  const { user } = useAuth();
  const [showWizard, setShowWizard] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [journals, setJournals] = useState<Journal[]>(() => {
    const savedJournals = localStorage.getItem(`journals_${user?.id}`);
    return savedJournals ? JSON.parse(savedJournals) : [];
  });

  const saveJournals = (newJournals: Journal[]) => {
    setJournals(newJournals);
    localStorage.setItem(`journals_${user?.id}`, JSON.stringify(newJournals));
  };

  const handleCreateJournal = (journalData: Omit<Journal, 'id' | 'createdAt'>) => {
    const newJournal: Journal = {
      ...journalData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const updatedJournals = [...journals, newJournal];
    saveJournals(updatedJournals);
    setShowWizard(false);
  };

  const handleUpdateJournal = (updatedJournal: Journal) => {
    const updatedJournals = journals.map(j => 
      j.id === updatedJournal.id ? updatedJournal : j
    );
    saveJournals(updatedJournals);
    setSelectedJournal(updatedJournal);
  };

  const handleDeleteJournal = (journalId: string) => {
    const updatedJournals = journals.filter(j => j.id !== journalId);
    saveJournals(updatedJournals);
    if (selectedJournal?.id === journalId) {
      setSelectedJournal(null);
    }
  };

  const handleQuickExport = async (journal: Journal) => {
    try {
      await exportJournalToExcelAdvanced(journal);
      // Небольшая задержка для обеспечения завершения скачивания
      setTimeout(() => {
        toast.success("Журнал экспортирован - файл Excel успешно сохранен");
      }, 200);
    } catch (error) {
      // Fallback на базовый CSV экспорт
      try {
        exportJournalToExcel(journal);
        setTimeout(() => {
          toast.success("Журнал экспортирован - файл CSV успешно сохранен (откроется в Excel)");
        }, 200);
      } catch (csvError) {
        console.error('Ошибка экспорта:', csvError);
        toast.error("Ошибка экспорта - не удалось экспортировать журнал");
      }
    }
  };

  // Если пользователь - студент, показываем StudentJournalView
  if (user?.role === 'student') {
    return <StudentJournalView />;
  }

  if (user?.role !== 'teacher') {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
          Доступ запрещен
        </h2>
        <p className="text-gray-500 dark:text-gray-500">
          Раздел журнала доступен только преподавателям и студентам
        </p>
      </div>
    );
  }

  if (showWizard) {
    return (
      <JournalCreationWizard
        onComplete={handleCreateJournal}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  if (selectedJournal) {
    return (
      <JournalView
        journal={selectedJournal}
        onUpdate={handleUpdateJournal}
        onBack={() => setSelectedJournal(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок раздела */}
      <div className="text-center py-8">
        <h1 className="text-3xl md:text-4xl mb-4">Журнал оценок</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Управляйте успеваемостью студентов, создавайте и редактируйте журналы оценок
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Мои журналы</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Всего журналов: {journals.length}
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Создать журнал
        </Button>
      </div>

      {journals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Журналы не созданы
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              Создайте первый журнал для начала работы с оценками студентов
            </p>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Создать первый журнал
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journals.map((journal) => (
            <Card key={journal.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{journal.course} курс</span>
                  <Badge variant="outline">{journal.group} группа</Badge>
                </CardTitle>
                <CardDescription>
                  {journal.faculty} • {journal.subject}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>Студентов: {journal.students.length}</p>
                    <p>Максимальный балл: {journal.maxScore}</p>
                    <p>Создан: {new Date(journal.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedJournal(journal)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Открыть
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickExport(journal)}
                      title="Быстро скачать Excel"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteJournal(journal.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}