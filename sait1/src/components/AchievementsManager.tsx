import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Checkbox } from "./ui/checkbox";
import { 
  Trophy, 
  Star, 
  Medal, 
  Award, 
  Target, 
  Crown, 
  Flame, 
  Zap, 
  BookOpen, 
  GraduationCap,
  Edit,
  Trash2,
  Plus,
  Save,
  AlertCircle,
  Users,
  Calendar,
  X
} from "lucide-react";
import { toast } from "../lib/toast";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  course: string;
  dateCreated: string;
  criteria: string;
  points: number;
  isActive: boolean;
}

interface StudentAchievement {
  studentId: string;
  achievementId: string;
  dateEarned: string;
  notes?: string;
}

const ICON_OPTIONS = [
  { value: "Trophy", label: "Трофей", icon: Trophy },
  { value: "Star", label: "Звезда", icon: Star },
  { value: "Medal", label: "Медаль", icon: Medal },
  { value: "Award", label: "Награда", icon: Award },
  { value: "Target", label: "Цель", icon: Target },
  { value: "Crown", label: "Корона", icon: Crown },
  { value: "Flame", label: "Пламя", icon: Flame },
  { value: "Zap", label: "Молния", icon: Zap },
  { value: "BookOpen", label: "Книга", icon: BookOpen },
  { value: "GraduationCap", label: "Шапочка", icon: GraduationCap }
];

const COLOR_OPTIONS = [
  { value: "default", label: "Стандартный", class: "" },
  { value: "primary", label: "Основной", class: "bg-primary text-primary-foreground" },
  { value: "secondary", label: "Вторичный", class: "bg-secondary text-secondary-foreground" },
  { value: "success", label: "Успех", class: "bg-green-500 text-white" },
  { value: "warning", label: "Предупреждение", class: "bg-yellow-500 text-white" },
  { value: "danger", label: "Опасность", class: "bg-red-500 text-white" },
  { value: "info", label: "Информация", class: "bg-blue-500 text-white" }
];

export function AchievementsManager() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [studentAchievements, setStudentAchievements] = useState<StudentAchievement[]>([]);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("achievements");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [users, setUsers] = useState<any>({});
  
  // Реф для фокусировки на первом поле при открытии диалога
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Форма создания/редактирования достижения
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "Trophy",
    color: "primary",
    course: "all",
    criteria: "",
    points: 10,
    isActive: true
  });

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    loadAchievements();
    loadStudentAchievements();
    loadUsers();
  }, []);

  // Фокусировка на первом поле при открытии диалога
  useEffect(() => {
    if (isDialogOpen && titleInputRef.current) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isDialogOpen]);

  const loadAchievements = () => {
    try {
      const stored = localStorage.getItem('achievements');
      if (stored) {
        setAchievements(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadStudentAchievements = () => {
    try {
      const stored = localStorage.getItem('studentAchievements');
      if (stored) {
        setStudentAchievements(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading student achievements:', error);
    }
  };

  const loadUsers = () => {
    try {
      const stored = localStorage.getItem('users');
      if (stored) {
        setUsers(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const saveAchievements = (newAchievements: Achievement[]) => {
    try {
      localStorage.setItem('achievements', JSON.stringify(newAchievements));
      setAchievements(newAchievements);
    } catch (error) {
      console.error('Error saving achievements:', error);
      toast.error("Ошибка при сохранении достижений");
    }
  };

  const saveStudentAchievements = (newStudentAchievements: StudentAchievement[]) => {
    try {
      localStorage.setItem('studentAchievements', JSON.stringify(newStudentAchievements));
      setStudentAchievements(newStudentAchievements);
    } catch (error) {
      console.error('Error saving student achievements:', error);
      toast.error("Ошибка при сохранении достижений студентов");
    }
  };

  const validateForm = () => {
    if (!formData.title?.trim()) {
      toast.error("Введите название достижения");
      return false;
    }
    if (!formData.description?.trim()) {
      toast.error("Введите описание достижения");
      return false;
    }
    if (formData.points < 0 || formData.points > 100) {
      toast.error("Баллы должны быть от 0 до 100");
      return false;
    }
    return true;
  };

  const handleCreateAchievement = () => {
    try {
      if (!validateForm()) return;

      const newAchievement: Achievement = {
        id: Date.now().toString(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        color: formData.color,
        course: formData.course,
        criteria: formData.criteria.trim(),
        points: Number(formData.points),
        isActive: formData.isActive,
        dateCreated: new Date().toISOString()
      };

      const updatedAchievements = [...achievements, newAchievement];
      saveAchievements(updatedAchievements);
      
      handleCloseDialog();
      toast.success("Достижение успешно создано!");
    } catch (error) {
      console.error('Error creating achievement:', error);
      toast.error("Ошибка при создании достижения");
    }
  };

  const handleUpdateAchievement = () => {
    try {
      if (!editingAchievement || !validateForm()) return;

      const updatedAchievements = achievements.map(achievement =>
        achievement.id === editingAchievement.id
          ? { 
              ...achievement, 
              title: formData.title.trim(),
              description: formData.description.trim(),
              icon: formData.icon,
              color: formData.color,
              course: formData.course,
              criteria: formData.criteria.trim(),
              points: Number(formData.points),
              isActive: formData.isActive
            }
          : achievement
      );

      saveAchievements(updatedAchievements);
      
      handleCloseDialog();
      toast.success("Достижение успешно обновлено!");
    } catch (error) {
      console.error('Error updating achievement:', error);
      toast.error("Ошибка при обновлении достижения");
    }
  };

  const handleDeleteAchievement = (achievementId: string) => {
    if (!confirm("Вы уверены, что хотите удалить это достижение? Это действие нельзя отменить.")) return;

    try {
      const updatedAchievements = achievements.filter(achievement => achievement.id !== achievementId);
      saveAchievements(updatedAchievements);

      // Также удаляем все связанные студенческие достижения
      const updatedStudentAchievements = studentAchievements.filter(
        sa => sa.achievementId !== achievementId
      );
      saveStudentAchievements(updatedStudentAchievements);

      toast.success("Достижение удалено!");
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast.error("Ошибка при удалении достижения");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      icon: "Trophy",
      color: "primary",
      course: "all",
      criteria: "",
      points: 10,
      isActive: true
    });
  };

  const openEditDialog = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setFormData({
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      color: achievement.color,
      course: achievement.course,
      criteria: achievement.criteria,
      points: achievement.points,
      isActive: achievement.isActive
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAchievement(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setEditingAchievement(null);
      resetForm();
    }, 150);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(option => option.value === iconName);
    return iconOption ? iconOption.icon : Trophy;
  };

  const getColorClass = (colorName: string) => {
    const colorOption = COLOR_OPTIONS.find(option => option.value === colorName);
    return colorOption ? colorOption.class : "";
  };

  const filteredAchievements = achievements.filter(achievement => 
    selectedCourse === "all" || achievement.course === selectedCourse || achievement.course === "all"
  );

  const getStudents = () => {
    return Object.values(users).filter((user: any) => user.role === 'student');
  };

  const getStudentAchievements = (studentId: string) => {
    return studentAchievements
      .filter(sa => sa.studentId === studentId)
      .map(sa => {
        const achievement = achievements.find(a => a.id === sa.achievementId);
        return { ...sa, achievement };
      })
      .filter(sa => sa.achievement);
  };

  const awardAchievement = (studentId: string, achievementId: string) => {
    try {
      // Проверяем, есть ли уже это достижение у студента
      const existingAward = studentAchievements.find(
        sa => sa.studentId === studentId && sa.achievementId === achievementId
      );

      if (existingAward) {
        toast.error("У студента уже есть это достижение");
        return;
      }

      const newStudentAchievement: StudentAchievement = {
        studentId,
        achievementId,
        dateEarned: new Date().toISOString()
      };

      const updatedStudentAchievements = [...studentAchievements, newStudentAchievement];
      saveStudentAchievements(updatedStudentAchievements);
      toast.success("Достижение присвоено студенту!");
    } catch (error) {
      console.error('Error awarding achievement:', error);
      toast.error("Ошибка при присвоении достижения");
    }
  };

  const removeStudentAchievement = (studentId: string, achievementId: string) => {
    try {
      const updatedStudentAchievements = studentAchievements.filter(
        sa => !(sa.studentId === studentId && sa.achievementId === achievementId)
      );
      saveStudentAchievements(updatedStudentAchievements);
      toast.success("Достижение отозвано у студента!");
    } catch (error) {
      console.error('Error removing student achievement:', error);
      toast.error("Ошибка при отзыве достижения");
    }
  };

  // Проверяем валидность формы для активации кнопки
  const isFormValid = formData.title.trim() && formData.description.trim() && 
    formData.points >= 0 && formData.points <= 100;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl mb-2">Управление достижениями</h2>
        <p className="text-muted-foreground">
          Создавайте и управляйте достижениями для студентов
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="achievements">Достижения</TabsTrigger>
          <TabsTrigger value="students">Студенты</TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Список достижений
                </CardTitle>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Курс" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все курсы</SelectItem>
                      <SelectItem value="1">1 курс</SelectItem>
                      <SelectItem value="2">2 курс</SelectItem>
                      <SelectItem value="3">3 курс</SelectItem>
                      <SelectItem value="4">4 курс</SelectItem>
                      <SelectItem value="5">5 курс</SelectItem>
                      <SelectItem value="6">6 курс</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать достижение
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAchievements.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Нет достижений для отображения</p>
                  <p className="text-sm">Создайте первое достижение для студентов</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[250px]">Достижение</TableHead>
                          <TableHead className="min-w-[200px]">Описание</TableHead>
                          <TableHead className="w-[100px]">Статус</TableHead>
                          <TableHead className="w-[100px]">Курс</TableHead>
                          <TableHead className="w-[80px]">Баллы</TableHead>
                          <TableHead className="w-[120px]">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAchievements.map(achievement => {
                          const IconComponent = getIconComponent(achievement.icon);
                          return (
                            <TableRow key={achievement.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${getColorClass(achievement.color)}`}>
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium truncate">{achievement.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Создано: {new Date(achievement.dateCreated).toLocaleDateString('ru-RU')}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="text-sm line-clamp-2">{achievement.description}</p>
                                  {achievement.criteria && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                      Критерии: {achievement.criteria}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={achievement.isActive ? "default" : "secondary"}>
                                  {achievement.isActive ? "Активно" : "Неактивно"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {achievement.course === "all" ? "Все" : `${achievement.course} к.`}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono">
                                  {achievement.points}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => openEditDialog(achievement)}
                                    title="Редактировать"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteAchievement(achievement.id)}
                                    title="Удалить"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Достижения студентов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Студент</TableHead>
                        <TableHead className="w-[100px]">Курс</TableHead>
                        <TableHead className="min-w-[300px]">Достижения</TableHead>
                        <TableHead className="min-w-[200px]">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getStudents().map((student: any) => {
                        const studentAchievements = getStudentAchievements(student.username);
                        return (
                          <TableRow key={student.username}>
                            <TableCell className="font-medium">
                              {student.username}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{student.course} курс</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  Получено: {studentAchievements.length}
                                </p>
                                {studentAchievements.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-lg">
                                    {studentAchievements.map((sa: any) => {
                                      const IconComponent = getIconComponent(sa.achievement.icon);
                                      return (
                                        <div 
                                          key={sa.achievementId} 
                                          className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs group"
                                          title={`${sa.achievement.title}: ${sa.achievement.description}`}
                                        >
                                          <div className={`p-0.5 rounded ${getColorClass(sa.achievement.color)}`}>
                                            <IconComponent className="h-3 w-3" />
                                          </div>
                                          <span className="max-w-20 truncate">{sa.achievement.title}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                            onClick={() => removeStudentAchievement(student.username, sa.achievementId)}
                                            title="Удалить достижение"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">Нет достижений</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select 
                                onValueChange={(achievementId) => awardAchievement(student.username, achievementId)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Присвоить достижение" />
                                </SelectTrigger>
                                <SelectContent>
                                  {achievements
                                    .filter(a => 
                                      a.isActive && 
                                      (a.course === "all" || a.course === student.course) &&
                                      !studentAchievements.some((sa: any) => sa.achievementId === a.id)
                                    )
                                    .map(achievement => {
                                      const IconComponent = getIconComponent(achievement.icon);
                                      return (
                                        <SelectItem key={achievement.id} value={achievement.id}>
                                          <div className="flex items-center gap-2">
                                            <IconComponent className="h-4 w-4" />
                                            <span className="truncate">{achievement.title}</span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Диалог создания/редактирования достижения */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="relative z-50 w-full max-w-2xl bg-background p-6 shadow-lg rounded-lg border max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">
                {editingAchievement ? "Редактировать достижение" : "Создать достижение"}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseDialog}
                className="h-auto p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title">Название *</Label>
                  <Input
                    id="title"
                    ref={titleInputRef}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Название достижения"
                    autoComplete="off"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Описание *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Описание достижения"
                    rows={3}
                    autoComplete="off"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icon">Иконка</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger id="icon" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map(option => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="color">Цвет</Label>
                    <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                      <SelectTrigger id="color" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded ${option.class || "bg-gray-300"}`} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="course">Курс</Label>
                    <Select value={formData.course} onValueChange={(value) => setFormData({ ...formData, course: value })}>
                      <SelectTrigger id="course" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Все курсы</SelectItem>
                        <SelectItem value="1">1 курс</SelectItem>
                        <SelectItem value="2">2 курс</SelectItem>
                        <SelectItem value="3">3 курс</SelectItem>
                        <SelectItem value="4">4 курс</SelectItem>
                        <SelectItem value="5">5 курс</SelectItem>
                        <SelectItem value="6">6 курс</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="points">Баллы</Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                      min="0"
                      max="100"
                      autoComplete="off"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="criteria">Критерии получения</Label>
                  <Textarea
                    id="criteria"
                    value={formData.criteria}
                    onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                    placeholder="Опишите критерии получения достижения"
                    rows={2}
                    autoComplete="off"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: Boolean(checked) })}
                  />
                  <Label htmlFor="isActive" className="text-sm">
                    Достижение активно
                  </Label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button 
                  onClick={() => editingAchievement ? handleUpdateAchievement() : handleCreateAchievement()}
                  className="flex-1"
                  disabled={!isFormValid}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingAchievement ? "Обновить" : "Создать"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCloseDialog}
                  className="flex-1 sm:flex-none"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}