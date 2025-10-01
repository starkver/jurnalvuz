import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Save, Edit3, Plus, Trash2, Download } from 'lucide-react';
import { exportJournalToExcel, exportJournalToExcelAdvanced } from '../lib/excel-export';
import { toast } from '../lib/toast';

interface Student {
  name: string;
  scores: number[];
  totalRating: number;
}

interface Journal {
  id: string;
  course: string;
  group: string;
  faculty: string;
  subject: string;
  maxScore: number;
  students: Student[];
  columns: string[];
  createdAt: string;
}

interface JournalViewProps {
  journal: Journal;
  onUpdate: (journal: Journal) => void;
  onBack: () => void;
}

export function JournalView({ journal, onUpdate, onBack }: JournalViewProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedJournal, setEditedJournal] = useState<Journal>({ ...journal });

  const calculateTotalRating = (scores: number[], maxScore: number) => {
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    return maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  };

  const updateStudentScore = (studentIndex: number, scoreIndex: number, value: string) => {
    const newStudents = [...editedJournal.students];
    const score = parseFloat(value) || 0;
    newStudents[studentIndex].scores[scoreIndex] = score;
    newStudents[studentIndex].totalRating = calculateTotalRating(
      newStudents[studentIndex].scores, 
      editedJournal.maxScore
    );
    setEditedJournal({ ...editedJournal, students: newStudents });
  };

  const updateStudentName = (studentIndex: number, name: string) => {
    const newStudents = [...editedJournal.students];
    newStudents[studentIndex].name = name;
    setEditedJournal({ ...editedJournal, students: newStudents });
  };

  const addStudent = () => {
    const newStudent: Student = {
      name: 'Новый студент',
      scores: new Array(editedJournal.columns.length).fill(0),
      totalRating: 0
    };
    setEditedJournal({
      ...editedJournal,
      students: [...editedJournal.students, newStudent]
    });
  };

  const removeStudent = (studentIndex: number) => {
    const newStudents = editedJournal.students.filter((_, index) => index !== studentIndex);
    setEditedJournal({ ...editedJournal, students: newStudents });
  };

  const addColumn = () => {
    const newColumnName = `Новая колонка ${editedJournal.columns.length + 1}`;
    const newColumns = [...editedJournal.columns, newColumnName];
    const newStudents = editedJournal.students.map(student => ({
      ...student,
      scores: [...student.scores, 0]
    }));
    setEditedJournal({
      ...editedJournal,
      columns: newColumns,
      students: newStudents
    });
  };

  const removeColumn = (columnIndex: number) => {
    if (editedJournal.columns.length <= 1) return;
    
    const newColumns = editedJournal.columns.filter((_, index) => index !== columnIndex);
    const newStudents = editedJournal.students.map(student => ({
      ...student,
      scores: student.scores.filter((_, index) => index !== columnIndex),
      totalRating: calculateTotalRating(
        student.scores.filter((_, index) => index !== columnIndex),
        editedJournal.maxScore
      )
    }));
    setEditedJournal({
      ...editedJournal,
      columns: newColumns,
      students: newStudents
    });
  };

  const updateColumnName = (columnIndex: number, name: string) => {
    const newColumns = [...editedJournal.columns];
    newColumns[columnIndex] = name;
    setEditedJournal({ ...editedJournal, columns: newColumns });
  };

  const updateMaxScore = (maxScore: number) => {
    const newStudents = editedJournal.students.map(student => ({
      ...student,
      totalRating: calculateTotalRating(student.scores, maxScore)
    }));
    setEditedJournal({
      ...editedJournal,
      maxScore,
      students: newStudents
    });
  };

  const handleSave = () => {
    onUpdate(editedJournal);
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditedJournal({ ...journal });
    setEditMode(false);
  };

  const handleExportToExcel = async () => {
    try {
      await exportJournalToExcelAdvanced(editedJournal);
      // Небольшая задержка для обеспечения завершения скачивания
      setTimeout(() => {
        toast.success("Журнал экспортирован - файл Excel успешно сохранен");
      }, 200);
    } catch (error) {
      // Fallback на базовый CSV экспорт
      try {
        exportJournalToExcel(editedJournal);
        setTimeout(() => {
          toast.success("Журнал экспортирован - файл CSV успешно сохранен (откроется в Excel)");
        }, 200);
      } catch (csvError) {
        console.error('Ошибка экспорта:', csvError);
        toast.error("Ошибка экспорта - не удалось экспортировать журнал");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {editedJournal.course} курс, {editedJournal.group} группа
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {editedJournal.faculty} • {editedJournal.subject}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!editMode && (
            <Button variant="outline" onClick={handleExportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Скачать Excel
            </Button>
          )}
          {editMode ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Отмена
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Edit3 className="h-4 w-4 mr-2" />
              Редактировать
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Настройки журнала
            <Badge variant="secondary">
              Максимальный балл: {editedJournal.maxScore}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {editMode && (
            <div className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Максимальный балл</label>
                  <Input
                    type="number"
                    value={editedJournal.maxScore}
                    onChange={(e) => updateMaxScore(parseInt(e.target.value) || 100)}
                  />
                </div>
                <Button variant="outline" onClick={addStudent}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить студента
                </Button>
                <Button variant="outline" onClick={addColumn}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить колонку
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Журнал оценок</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border">
              <thead>
                <tr>
                  <th className="border p-3 bg-gray-50 dark:bg-gray-800 text-left">
                    ФИО
                    {editMode && (
                      <div className="text-xs text-gray-500 mt-1">
                        Студентов: {editedJournal.students.length}
                      </div>
                    )}
                  </th>
                  {editedJournal.columns.map((column, index) => (
                    <th key={index} className="border p-3 bg-gray-50 dark:bg-gray-800">
                      {editMode ? (
                        <div className="space-y-2">
                          <Input
                            value={column}
                            onChange={(e) => updateColumnName(index, e.target.value)}
                            className="text-sm"
                          />
                          {editedJournal.columns.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeColumn(index)}
                              className="w-full text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        column
                      )}
                    </th>
                  ))}
                  <th className="border p-3 bg-gray-50 dark:bg-gray-800">
                    Итоговый рейтинг
                  </th>
                  {editMode && (
                    <th className="border p-3 bg-gray-50 dark:bg-gray-800 w-16">
                      Действия
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {editedJournal.students.map((student, studentIndex) => (
                  <tr key={studentIndex}>
                    <td className="border p-3">
                      {editMode ? (
                        <Input
                          value={student.name}
                          onChange={(e) => updateStudentName(studentIndex, e.target.value)}
                          className="font-medium"
                        />
                      ) : (
                        <span className="font-medium">{student.name}</span>
                      )}
                    </td>
                    {student.scores.map((score, scoreIndex) => (
                      <td key={scoreIndex} className="border p-3 text-center">
                        {editMode ? (
                          <Input
                            type="number"
                            value={score}
                            onChange={(e) => updateStudentScore(studentIndex, scoreIndex, e.target.value)}
                            className="text-center"
                            min="0"
                          />
                        ) : (
                          score
                        )}
                      </td>
                    ))}
                    <td className="border p-3 text-center">
                      <Badge 
                        variant={student.totalRating >= 80 ? "default" : 
                                student.totalRating >= 60 ? "secondary" : "destructive"}
                      >
                        {(student.totalRating / 100).toFixed(2)}
                      </Badge>
                    </td>
                    {editMode && (
                      <td className="border p-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeStudent(studentIndex)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editedJournal.students.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Студенты не добавлены</p>
              {editMode && (
                <Button variant="outline" onClick={addStudent} className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить первого студента
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Статистика</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-2xl font-bold">
                {editedJournal.students.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Студентов
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {editedJournal.students.filter(s => s.totalRating >= 80).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Отлично (≥0.8)
              </div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {editedJournal.students.filter(s => s.totalRating >= 60 && s.totalRating < 80).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Хорошо (0.6-0.79)
              </div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {editedJournal.students.filter(s => s.totalRating < 60).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Неуд. (&lt;0.6)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}