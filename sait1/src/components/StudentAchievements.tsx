import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
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
  Calendar,
  TrendingUp
} from "lucide-react";

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

interface StudentAchievementsProps {
  studentId: string;
  studentCourse: string;
  compact?: boolean;
}

const ICON_OPTIONS = [
  { value: "Trophy", icon: Trophy },
  { value: "Star", icon: Star },
  { value: "Medal", icon: Medal },
  { value: "Award", icon: Award },
  { value: "Target", icon: Target },
  { value: "Crown", icon: Crown },
  { value: "Flame", icon: Flame },
  { value: "Zap", icon: Zap },
  { value: "BookOpen", icon: BookOpen },
  { value: "GraduationCap", icon: GraduationCap }
];

const COLOR_OPTIONS = [
  { value: "default", class: "" },
  { value: "primary", class: "bg-primary text-primary-foreground" },
  { value: "secondary", class: "bg-secondary text-secondary-foreground" },
  { value: "success", class: "bg-green-500 text-white" },
  { value: "warning", class: "bg-yellow-500 text-white" },
  { value: "danger", class: "bg-red-500 text-white" },
  { value: "info", class: "bg-blue-500 text-white" }
];

export function StudentAchievements({ studentId, studentCourse, compact = false }: StudentAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [studentAchievements, setStudentAchievements] = useState<StudentAchievement[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Загружаем достижения
    const storedAchievements = localStorage.getItem('achievements');
    if (storedAchievements) {
      setAchievements(JSON.parse(storedAchievements));
    }

    // Загружаем достижения студентов
    const storedStudentAchievements = localStorage.getItem('studentAchievements');
    if (storedStudentAchievements) {
      setStudentAchievements(JSON.parse(storedStudentAchievements));
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(option => option.value === iconName);
    return iconOption ? iconOption.icon : Trophy;
  };

  const getColorClass = (colorName: string) => {
    const colorOption = COLOR_OPTIONS.find(option => option.value === colorName);
    return colorOption ? colorOption.class : "";
  };

  // Мемоизируем вычисления для оптимизации производительности
  const earnedAchievements = useMemo(() => {
    return studentAchievements
      .filter(sa => sa.studentId === studentId)
      .map(sa => {
        const achievement = achievements.find(a => a.id === sa.achievementId);
        return achievement ? { ...sa, achievement } : null;
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.dateEarned).getTime() - new Date(a.dateEarned).getTime());
  }, [studentAchievements, studentId, achievements]);

  // Получаем доступные достижения для курса студента
  const availableAchievements = useMemo(() => {
    return achievements.filter(achievement => 
      achievement.isActive && 
      (achievement.course === "all" || achievement.course === studentCourse)
    );
  }, [achievements, studentCourse]);

  // Подсчитываем статистику
  const { totalPoints, completionRate } = useMemo(() => {
    const points = earnedAchievements.reduce((sum, ea) => sum + (ea.achievement?.points || 0), 0);
    const rate = availableAchievements.length > 0 
      ? (earnedAchievements.length / availableAchievements.length) * 100 
      : 0;
    return { totalPoints: points, completionRate: rate };
  }, [earnedAchievements, availableAchievements]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" />
            Достижения
            {earnedAchievements.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {earnedAchievements.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnedAchievements.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Пока нет достижений</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Прогресс: {earnedAchievements.length}/{availableAchievements.length}</span>
                <span>{totalPoints} баллов</span>
              </div>
              <Progress value={completionRate} className="h-2 mb-3" />
              
              <div className="flex flex-wrap gap-2">
                {earnedAchievements.slice(0, 6).map((ea: any) => {
                  const IconComponent = getIconComponent(ea.achievement.icon);
                  return (
                    <div 
                      key={ea.achievementId}
                      className={`flex items-center gap-1 p-2 rounded-lg text-xs ${getColorClass(ea.achievement.color)} ${
                        !getColorClass(ea.achievement.color) ? 'bg-muted' : ''
                      }`}
                      title={`${ea.achievement.title} - ${ea.achievement.description}`}
                    >
                      <IconComponent className="h-3 w-3" />
                      <span className="max-w-20 truncate">{ea.achievement.title}</span>
                    </div>
                  );
                })}
                {earnedAchievements.length > 6 && (
                  <div className="flex items-center justify-center p-2 bg-muted rounded-lg text-xs">
                    +{earnedAchievements.length - 6}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Trophy className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Всего достижений</p>
                <p className="text-2xl font-semibold">{earnedAchievements.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Общие баллы</p>
                <p className="text-2xl font-semibold">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Прогресс</p>
                <p className="text-2xl font-semibold">{Math.round(completionRate)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Список достижений */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5" />
            Полученные достижения
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnedAchievements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Пока нет достижений</p>
              <p className="text-sm mt-2">
                Участвуйте в обучении и выполняйте задания, чтобы получить первые достижения!
              </p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {earnedAchievements.map((ea: any) => {
                  const IconComponent = getIconComponent(ea.achievement.icon);
                  return (
                    <div key={ea.achievementId} className="flex items-start gap-4 p-3 border rounded-lg">
                      <div className={`p-2 rounded-lg ${getColorClass(ea.achievement.color)} ${
                        !getColorClass(ea.achievement.color) ? 'bg-primary text-primary-foreground' : ''
                      }`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{ea.achievement.title}</h3>
                          <Badge variant="outline">
                            {ea.achievement.points} баллов
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {ea.achievement.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Получено {formatDate(ea.dateEarned)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Доступные достижения */}
      {availableAchievements.length > earnedAchievements.length && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Доступные достижения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {availableAchievements
                  .filter(achievement => 
                    !earnedAchievements.some((ea: any) => ea.achievementId === achievement.id)
                  )
                  .map(achievement => {
                    const IconComponent = getIconComponent(achievement.icon);
                    return (
                      <div key={achievement.id} className="flex items-start gap-4 p-3 border rounded-lg opacity-60">
                        <div className={`p-2 rounded-lg ${getColorClass(achievement.color)} ${
                          !getColorClass(achievement.color) ? 'bg-muted' : ''
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{achievement.title}</h3>
                            <Badge variant="outline">
                              {achievement.points} баллов
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          {achievement.criteria && (
                            <p className="text-xs text-muted-foreground">
                              Критерии: {achievement.criteria}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}