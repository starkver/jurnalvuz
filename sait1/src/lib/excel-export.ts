// Утилита для экспорта данных журнала в Excel

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

// Функция для создания CSV контента (совместимого с Excel)
function createCSVContent(journal: Journal): string {
  const lines: string[] = [];
  
  // Заголовок с информацией о журнале
  lines.push(`Электронный журнал - ${journal.course} курс, ${journal.group} группа`);
  lines.push(`Факультет: ${journal.faculty}`);
  lines.push(`Предмет: ${journal.subject}`);
  lines.push(`Максимальный балл: ${journal.maxScore}`);
  lines.push(`Дата создания: ${new Date(journal.createdAt).toLocaleDateString('ru-RU')}`);
  lines.push(`Дата экспорта: ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}`);
  lines.push(''); // Пустая строка
  
  // Заголовки таблицы
  const headers = ['№', 'ФИО студента', ...journal.columns, 'Сумма баллов', 'Итоговый рейтинг (%)', 'Оценка'];
  lines.push(headers.join(';'));
  
  // Данные студентов
  journal.students.forEach((student, index) => {
    const totalScore = student.scores.reduce((sum, score) => sum + score, 0);
    const grade = getGradeFromRating(student.totalRating);
    
    const row = [
      (index + 1).toString(),
      student.name,
      ...student.scores.map(score => score.toString()),
      totalScore.toString(),
      student.totalRating.toFixed(2),
      grade
    ];
    lines.push(row.join(';'));
  });
  
  // Статистика
  lines.push('');
  lines.push('СТАТИСТИКА');
  lines.push(`Всего студентов;${journal.students.length}`);
  lines.push(`Отлично (≥80%);${journal.students.filter(s => s.totalRating >= 80).length}`);
  lines.push(`Хорошо (60-79%);${journal.students.filter(s => s.totalRating >= 60 && s.totalRating < 80).length}`);
  lines.push(`Удовлетворительно (40-59%);${journal.students.filter(s => s.totalRating >= 40 && s.totalRating < 60).length}`);
  lines.push(`Неудовлетворительно (<40%);${journal.students.filter(s => s.totalRating < 40).length}`);
  lines.push(`Средний балл;${calculateAverageRating(journal.students).toFixed(2)}%`);
  
  return lines.join('\n');
}

// Функция для получения оценки по рейтингу
function getGradeFromRating(rating: number): string {
  if (rating >= 80) return 'Отлично';
  if (rating >= 60) return 'Хорошо';
  if (rating >= 40) return 'Удовлетворительно';
  return 'Неудовлетворительно';
}

// Функция для расчета среднего рейтинга
function calculateAverageRating(students: Student[]): number {
  if (students.length === 0) return 0;
  const totalRating = students.reduce((sum, student) => sum + student.totalRating, 0);
  return totalRating / students.length;
}

// Основная функция экспорта
export function exportJournalToExcel(journal: Journal): void {
  try {
    // Создаем CSV контент
    const csvContent = createCSVContent(journal);
    
    // Добавляем BOM для корректного отображения кириллицы в Excel
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    // Создаем Blob
    const blob = new Blob([csvWithBOM], { 
      type: 'text/csv;charset=utf-8' 
    });
    
    // Создаем ссылку для скачивания
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    
    // Формируем имя файла (безопасное для файловой системы)
    const safeSubject = journal.subject.replace(/[/\\?%*:|"<>]/g, '-');
    const safeGroup = journal.group.replace(/[/\\?%*:|"<>]/g, '-');
    const date = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
    const fileName = `Журнал_${journal.course}_курс_${safeGroup}_группа_${safeSubject}_${date}.csv`;
    link.download = fileName;
    
    // Триггерим скачивание
    document.body.appendChild(link);
    link.click();
    
    // Очищаем ресурсы
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 100);
    
  } catch (error) {
    console.error('Ошибка при экспорте журнала:', error);
    throw new Error('Не удалось экспортировать журнал');
  }
}

// Функция для создания Excel-совместимого HTML файла
export function exportJournalToExcelAdvanced(journal: Journal): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Создаем HTML-таблицу, которую Excel может открыть
      const htmlContent = createExcelCompatibleHTML(journal);
      
      // Создаем Blob с HTML содержимым
      const blob = new Blob([htmlContent], { 
        type: 'application/vnd.ms-excel;charset=utf-8' 
      });
      
      // Создаем ссылку для скачивания
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      
      // Формируем безопасное имя файла с расширением .xls
      const safeSubject = journal.subject.replace(/[/\\?%*:|"<>]/g, '-');
      const safeGroup = journal.group.replace(/[/\\?%*:|"<>]/g, '-');
      const date = new Date().toLocaleDateString('ru-RU').replace(/\./g, '-');
      const fileName = `Журнал_${journal.course}_курс_${safeGroup}_группа_${safeSubject}_${date}.xls`;
      link.download = fileName;
      
      // Триггерим скачивание
      document.body.appendChild(link);
      link.click();
      
      // Очищаем ресурсы с задержкой
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 100);
      
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

// Функция для создания HTML-таблицы, совместимой с Excel
function createExcelCompatibleHTML(journal: Journal): string {
  const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Excel.Sheet">
  <meta name="Generator" content="Educational Portal">
  <style>
    body { font-family: Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #000; padding: 5px; text-align: left; }
    th { background-color: #f0f0f0; font-weight: bold; }
    .header-info { margin-bottom: 20px; }
    .stats-table { margin-top: 30px; }
    .number-cell { text-align: center; }
    .rating-cell { text-align: center; font-weight: bold; }
    .excellent { color: #059669; }
    .good { color: #d97706; }
    .satisfactory { color: #0891b2; }
    .unsatisfactory { color: #dc2626; }
  </style>
</head>
<body>
  <div class="header-info">
    <h1>Электронный журнал - ${journal.course} курс, ${journal.group} группа</h1>
    <p><strong>Факультет:</strong> ${journal.faculty}</p>
    <p><strong>Предмет:</strong> ${journal.subject}</p>
    <p><strong>Максимальный балл:</strong> ${journal.maxScore}</p>
    <p><strong>Дата создания:</strong> ${new Date(journal.createdAt).toLocaleDateString('ru-RU')}</p>
    <p><strong>Дата экспорта:</strong> ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th class="number-cell">№</th>
        <th>ФИО студента</th>
        ${journal.columns.map(col => `<th class="number-cell">${col}</th>`).join('')}
        <th class="number-cell">Сумма баллов</th>
        <th class="number-cell">Итоговый рейтинг (%)</th>
        <th>Оценка</th>
      </tr>
    </thead>
    <tbody>
      ${journal.students.map((student, index) => {
        const totalScore = student.scores.reduce((sum, score) => sum + score, 0);
        const grade = getGradeFromRating(student.totalRating);
        const gradeClass = getGradeClass(student.totalRating);
        
        return `
        <tr>
          <td class="number-cell">${index + 1}</td>
          <td>${student.name}</td>
          ${student.scores.map(score => `<td class="number-cell">${score}</td>`).join('')}
          <td class="number-cell">${totalScore}</td>
          <td class="rating-cell ${gradeClass}">${student.totalRating.toFixed(2)}</td>
          <td class="${gradeClass}">${grade}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="stats-table">
    <h2>Статистика</h2>
    <table style="width: 400px;">
      <tr><th>Показатель</th><th>Значение</th></tr>
      <tr><td>Всего студентов</td><td class="number-cell">${journal.students.length}</td></tr>
      <tr><td>Отлично (≥80%)</td><td class="number-cell excellent">${journal.students.filter(s => s.totalRating >= 80).length}</td></tr>
      <tr><td>Хорошо (60-79%)</td><td class="number-cell good">${journal.students.filter(s => s.totalRating >= 60 && s.totalRating < 80).length}</td></tr>
      <tr><td>Удовлетворительно (40-59%)</td><td class="number-cell satisfactory">${journal.students.filter(s => s.totalRating >= 40 && s.totalRating < 60).length}</td></tr>
      <tr><td>Неудовлетворительно (&lt;40%)</td><td class="number-cell unsatisfactory">${journal.students.filter(s => s.totalRating < 40).length}</td></tr>
      <tr><td>Средний балл</td><td class="number-cell">${calculateAverageRating(journal.students).toFixed(2)}%</td></tr>
    </table>
  </div>
</body>
</html>`;
  
  return html;
}

// Функция для получения CSS класса по рейтингу
function getGradeClass(rating: number): string {
  if (rating >= 80) return 'excellent';
  if (rating >= 60) return 'good';
  if (rating >= 40) return 'satisfactory';
  return 'unsatisfactory';
}