import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';

interface JournalData {
  course: string;
  group: string;
  faculty: string;
  subject: string;
  students: Array<{
    name: string;
    scores: number[];
    totalRating: number;
  }>;
  columns: string[];
  maxScore: number;
}

interface JournalCreationWizardProps {
  onComplete: (data: JournalData) => void;
  onCancel: () => void;
}

export function JournalCreationWizard({ onComplete, onCancel }: JournalCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<JournalData>>({
    course: '',
    group: '',
    faculty: '',
    subject: '',
    students: [],
    columns: ['ФИО'],
    maxScore: 100
  });

  // Step 1: Basic Information
  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Создание журнала
          <Badge variant="outline">Шаг 1 из 3</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="course">Курс</Label>
            <Select value={formData.course} onValueChange={(value) => setFormData({...formData, course: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите курс" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 курс</SelectItem>
                <SelectItem value="2">2 курс</SelectItem>
                <SelectItem value="3">3 курс</SelectItem>
                <SelectItem value="4">4 курс</SelectItem>
                <SelectItem value="5">5 курс</SelectItem>
                <SelectItem value="6">6 курс</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group">Группа</Label>
            <Input
              id="group"
              placeholder="Номер группы"
              value={formData.group || ''}
              onChange={(e) => setFormData({...formData, group: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="faculty">Факультет</Label>
            <Select value={formData.faculty} onValueChange={(value) => setFormData({...formData, faculty: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите факультет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pediatrics">Педиатрия</SelectItem>
                <SelectItem value="therapy">Лечебное дело</SelectItem>
                <SelectItem value="dentistry">Стоматология</SelectItem>
                <SelectItem value="pharmacy">Фармация</SelectItem>
                <SelectItem value="nursing">Сестринское дело</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">Предмет</Label>
          <Input
            id="subject"
            placeholder="Название предмета"
            value={formData.subject || ''}
            onChange={(e) => setFormData({...formData, subject: e.target.value})}
          />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Отмена
          </Button>
          <Button 
            onClick={() => setCurrentStep(2)}
            disabled={!formData.course || !formData.group || !formData.faculty || !formData.subject}
          >
            Далее
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 2: Table Structure
  const [tableData, setTableData] = useState<string[][]>([['ФИО']]);
  const [columnNames, setColumnNames] = useState<string[]>(['ФИО']);

  const addRow = () => {
    setTableData([...tableData, new Array(columnNames.length).fill('')]);
  };

  const addColumn = () => {
    const newColumnName = `Колонка ${columnNames.length}`;
    setColumnNames([...columnNames, newColumnName]);
    setTableData(tableData.map(row => [...row, '']));
  };

  const removeRow = (index: number) => {
    if (tableData.length > 1) {
      setTableData(tableData.filter((_, i) => i !== index));
    }
  };

  const removeColumn = (index: number) => {
    if (columnNames.length > 1) {
      setColumnNames(columnNames.filter((_, i) => i !== index));
      setTableData(tableData.map(row => row.filter((_, i) => i !== index)));
    }
  };

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newTableData = [...tableData];
    newTableData[rowIndex][colIndex] = value;
    setTableData(newTableData);
  };

  const updateColumnName = (index: number, value: string) => {
    const newColumnNames = [...columnNames];
    newColumnNames[index] = value;
    setColumnNames(newColumnNames);
  };

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Структура таблицы
          <Badge variant="outline">Шаг 2 из 3</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить строку
          </Button>
          <Button variant="outline" size="sm" onClick={addColumn}>
            <Plus className="h-4 w-4 mr-2" />
            Добавить столбец
          </Button>
        </div>

        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {columnNames.map((colName, colIndex) => (
                  <th key={colIndex} className="border p-2 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <Input
                        value={colName}
                        onChange={(e) => updateColumnName(colIndex, e.target.value)}
                        className="text-sm"
                      />
                      {columnNames.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeColumn(colIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="border p-2 bg-gray-50 dark:bg-gray-800 w-12">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="border p-2">
                      <Input
                        value={cell}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        className="text-sm"
                        placeholder={colIndex === 0 ? "ФИО студента" : "Данные"}
                      />
                    </td>
                  ))}
                  <td className="border p-2 text-center">
                    {tableData.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Button 
            onClick={() => setCurrentStep(3)}
            disabled={tableData.length === 0 || tableData.every(row => row[0] === '')}
          >
            Далее
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Step 3: Max Score
  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Настройки оценивания
          <Badge variant="outline">Шаг 3 из 3</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="maxScore">Максимальный балл</Label>
          <Input
            id="maxScore"
            type="number"
            placeholder="100"
            value={formData.maxScore || ''}
            onChange={(e) => setFormData({...formData, maxScore: parseInt(e.target.value) || 100})}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Максимальное количество баллов, которое студент может получить за семестр
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Предварительный просмотр</h3>
          <div className="text-sm space-y-1">
            <p><strong>Курс:</strong> {formData.course}</p>
            <p><strong>Группа:</strong> {formData.group}</p>
            <p><strong>Факультет:</strong> {formData.faculty}</p>
            <p><strong>Предмет:</strong> {formData.subject}</p>
            <p><strong>Студентов:</strong> {tableData.length}</p>
            <p><strong>Столбцов оценок:</strong> {columnNames.length - 1}</p>
            <p><strong>Максимальный балл:</strong> {formData.maxScore}</p>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <Button onClick={handleComplete}>
            Создать журнал
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const handleComplete = () => {
    const students = tableData.map(row => ({
      name: row[0] || 'Без имени',
      scores: new Array(columnNames.length - 1).fill(0),
      totalRating: 0
    }));

    const journalData: JournalData = {
      course: formData.course!,
      group: formData.group!,
      faculty: formData.faculty!,
      subject: formData.subject!,
      students,
      columns: columnNames.slice(1), // Убираем "ФИО" из колонок оценок
      maxScore: formData.maxScore || 100
    };

    onComplete(journalData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
    </div>
  );
}