import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from './AuthContext';
import { BookOpen, TrendingUp, Calendar, Award, ChevronDown } from 'lucide-react';

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

export function StudentJournalView() {
  const { user } = useAuth();
  const [allJournals, setAllJournals] = useState<Journal[]>([]);
  const [myResults, setMyResults] = useState<Array<{
    journal: Journal;
    student: Journal['students'][0];
    position: number;
  }>>([]);
  const [selectedCourseForStats, setSelectedCourseForStats] = useState<string>('');
  const [availableCourses, setAvailableCourses] = useState<string[]>([]);

  useEffect(() => {
    // Загружаем все журналы от всех преподавателей
    const loadAllJournals = () => {
      try {
        if (!user?.username) return;
        
        const allUsers = JSON.parse(localStorage.getItem('users') || '{}');
        const journals: Journal[] = [];
        
        Object.values(allUsers).forEach((userData: any) => {
          if (userData.role === 'teacher') {
            try {
              const teacherJournals = JSON.parse(localStorage.getItem(`journals_${userData.id}`) || '[]');
              if (Array.isArray(teacherJournals)) {
                journals.push(...teacherJournals);
              }
            } catch (error) {
              console.warn(`Failed to load journals for teacher ${userData.id}:`, error);
            }
          }
        });

        setAllJournals(journals);
        
        // Находим результаты текущего студента
        const usernameLower = user.username.toLowerCase();
        const studentResults: typeof myResults = [];
        
        for (const journal of journals) {
          if (!journal.students || !Array.isArray(journal.students)) continue;
          
          const studentIndex = journal.students.findIndex(student => 
            student.name && student.name.toLowerCase().includes(usernameLower)
          );
          
          if (studentIndex !== -1) {
            const student = journal.students[studentIndex];
            // Вычисляем позицию в рейтинге
            const sortedStudents = [...journal.students]
              .filter(s => s && typeof s.totalRating === 'number')
              .sort((a, b) => b.totalRating - a.totalRating);
            const position = sortedStudents.findIndex(s => s.name === student.name) + 1;
            
            studentResults.push({
              journal,
              student,
              position: position || 1
            });
          }
        }

        setMyResults(studentResults);
        
        // Определяем доступные курсы из результатов студента
        const courses = [...new Set(studentResults.map(result => result.journal.course))].sort();
        setAvailableCourses(courses);
        
        // Устанавливаем курс студента по умолчанию, если он есть в доступных курсах
        if (user?.course && courses.includes(user.course)) {
          setSelectedCourseForStats(user.course);
        } else if (courses.length > 1) {
          // Если курсов несколько и курс студента не найден, показываем "За все время"
          setSelectedCourseForStats('all');
        } else if (courses.length > 0) {
          // Если курс один, показываем его
          setSelectedCourseForStats(courses[0]);
        }
      } catch (error) {
        console.error('Error loading student journals:', error);
        setMyResults([]);
        setAllJournals([]);
        setAvailableCourses([]);
        setSelectedCourseForStats('');
      }
    };

    if (user?.role === 'student' && user?.username) {
      loadAllJournals();
    } else {
      setMyResults([]);
      setAllJournals([]);
    }
  }, [user?.role, user?.username]);

  if (user?.role !== 'student') {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
          Доступ запрещен
        </h2>
        <p className="text-gray-500 dark:text-gray-500">
          Раздел просмотра оценок доступен только студентам
        </p>
      </div>
    );
  }

  const calculateGrade = (totalRating: number) => {
    // totalRating в процентном формате, конвертируем для сравнения
    const rating = totalRating / 100;
    if (rating >= 0.9) return { grade: 5, label: 'Отлично' };
    if (rating >= 0.75) return { grade: 4, label: 'Хорошо' };
    if (rating >= 0.6) return { grade: 3, label: 'Удовлетворительно' };
    return { grade: 2, label: 'Неудовлетворительно' };
  };

  const getRatingBadgeColor = (position: number, totalStudents: number) => {
    const percentage = (position / totalStudents) * 100;
    if (percentage <= 20) return 'default'; // Топ 20%
    if (percentage <= 50) return 'secondary'; // Топ 50%
    return 'outline'; // Остальные
  };

  // Функции для расчета статистики по выбранному курсу
  const getResultsForCourse = (course: string) => {
    return myResults.filter(result => result.journal.course === course);
  };

  const calculateAverageGradeForCourse = (course: string) => {
    const courseResults = getResultsForCourse(course);
    if (courseResults.length === 0) return 0;
    return courseResults.reduce((sum, result) => sum + result.student.totalRating, 0) / courseResults.length;
  };

  const calculateBestResultForCourse = (course: string) => {
    const courseResults = getResultsForCourse(course);
    if (courseResults.length === 0) return 0;
    return Math.max(...courseResults.map(result => result.student.totalRating));
  };

  const getCurrentCourseStats = () => {
    if (!selectedCourseForStats) return { averageGrade: 0, bestResult: 0, subjectsCount: 0 };
    
    if (selectedCourseForStats === 'all') {
      // Статистика за все время
      const averageGrade = myResults.length > 0 
        ? myResults.reduce((sum, result) => sum + result.student.totalRating, 0) / myResults.length 
        : 0;
      const bestResult = myResults.length > 0 
        ? Math.max(...myResults.map(result => result.student.totalRating)) 
        : 0;
      
      return {
        averageGrade,
        bestResult,
        subjectsCount: myResults.length
      };
    }
    
    const courseResults = getResultsForCourse(selectedCourseForStats);
    return {
      averageGrade: calculateAverageGradeForCourse(selectedCourseForStats),
      bestResult: calculateBestResultForCourse(selectedCourseForStats),
      subjectsCount: courseResults.length
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Мои оценки</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Просмотр успеваемости и рейтинга по предметам
          </p>
        </div>
        {myResults.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <span className="text-sm text-muted-foreground">Статистика по курсу:</span>
            <div className="flex gap-2">
              <Select 
                value={selectedCourseForStats} 
                onValueChange={setSelectedCourseForStats}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">За все время</SelectItem>
                  {availableCourses.map(course => (
                    <SelectItem key={course} value={course}>
                      {course} курс
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {myResults.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Оценки не найдены
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              Возможно, преподаватели еще не создали журналы или не добавили ваше имя в списки
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="detailed">Подробно</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Общая статистика */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Предметов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getCurrentCourseStats().subjectsCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedCourseForStats === 'all' ? 'За все время' : `${selectedCourseForStats} курс`}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Средний балл
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(getCurrentCourseStats().averageGrade / 100).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedCourseForStats === 'all' 
                      ? `За все время (${getCurrentCourseStats().subjectsCount} предмет${getCurrentCourseStats().subjectsCount === 1 ? '' : getCurrentCourseStats().subjectsCount < 5 ? 'а' : 'ов'})`
                      : `${selectedCourseForStats} курс (${getCurrentCourseStats().subjectsCount} предмет${getCurrentCourseStats().subjectsCount === 1 ? '' : getCurrentCourseStats().subjectsCount < 5 ? 'а' : 'ов'})`
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Лучший результат
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(getCurrentCourseStats().bestResult / 100).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedCourseForStats === 'all' ? 'За все время' : `${selectedCourseForStats} курс`}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Последнее обновление
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-bold">
                    {myResults.length > 0 
                      ? new Date(Math.max(...myResults.map(r => new Date(r.journal.createdAt).getTime()))).toLocaleDateString()
                      : 'Нет данных'
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Краткий список предметов */}
            <div className="space-y-4">
              {/* Показываем предметы текущего курса студента */}
              {user?.course && getResultsForCourse(user.course).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Мой курс ({user.course} курс)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getResultsForCourse(user.course).map((result, index) => {
                      const gradeInfo = calculateGrade(result.student.totalRating);
                      return (
                        <Card key={`current-${index}`} className="border-primary/20">
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              {result.journal.subject}
                              <Badge variant={getRatingBadgeColor(result.position, result.journal.students.length)}>
                                #{result.position} из {result.journal.students.length}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              {result.journal.course} курс • {result.journal.group} группа
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Успеваемость:</span>
                                <span className="font-semibold">
                                  {(result.student.totalRating / 100).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Оценка:</span>
                                <Badge variant={gradeInfo.grade >= 4 ? 'default' : 'destructive'}>
                                  {gradeInfo.grade} ({gradeInfo.label})
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Показываем предметы других курсов, если они есть */}
              {availableCourses.filter(course => course !== user?.course).map(course => {
                const courseResults = getResultsForCourse(course);
                if (courseResults.length === 0) return null;
                
                return (
                  <div key={course}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {course} курс
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courseResults.map((result, index) => {
                        const gradeInfo = calculateGrade(result.student.totalRating);
                        return (
                          <Card key={`other-${course}-${index}`}>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                {result.journal.subject}
                                <Badge variant={getRatingBadgeColor(result.position, result.journal.students.length)}>
                                  #{result.position} из {result.journal.students.length}
                                </Badge>
                              </CardTitle>
                              <CardDescription>
                                {result.journal.course} курс • {result.journal.group} группа
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Успеваемость:</span>
                                  <span className="font-semibold">
                                    {(result.student.totalRating / 100).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm">Оценка:</span>
                                  <Badge variant={gradeInfo.grade >= 4 ? 'default' : 'destructive'}>
                                    {gradeInfo.grade} ({gradeInfo.label})
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            {myResults.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {result.journal.subject}
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {result.journal.course} курс
                      </Badge>
                      <Badge variant={getRatingBadgeColor(result.position, result.journal.students.length)}>
                        #{result.position} место
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {result.journal.faculty} • {result.journal.group} группа
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Детальные оценки */}
                    <div>
                      <h4 className="font-medium mb-2">Детальные оценки:</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border rounded-lg">
                          <thead>
                            <tr>
                              {result.journal.columns.map((column, colIndex) => (
                                <th key={colIndex} className="border p-2 bg-gray-50 dark:bg-gray-800 text-left">
                                  {column}
                                </th>
                              ))}
                              <th className="border p-2 bg-gray-50 dark:bg-gray-800 text-left">
                                Итого
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {result.student.scores.map((score, scoreIndex) => (
                                <td key={scoreIndex} className="border p-2">
                                  <Badge variant={score > 0 ? 'default' : 'outline'}>
                                    {score}
                                  </Badge>
                                </td>
                              ))}
                              <td className="border p-2">
                                <Badge variant="default" className="text-lg">
                                  {(result.student.totalRating / 100).toFixed(2)}
                                </Badge>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Статистика */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Максимум:</p>
                        <p className="font-semibold">{result.journal.maxScore}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Набрано:</p>
                        <p className="font-semibold">{result.student.scores.reduce((sum, score) => sum + score, 0)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Успеваемость:</p>
                        <p className="font-semibold">
                          {(result.student.totalRating / 100).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Оценка:</p>
                        <p className="font-semibold">
                          {calculateGrade(result.student.totalRating).grade}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}