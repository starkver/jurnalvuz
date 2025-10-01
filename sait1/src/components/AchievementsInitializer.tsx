import { useEffect } from "react";

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

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "welcome",
    title: "Добро пожаловать!",
    description: "Первый вход в образовательный портал",
    icon: "Star",
    color: "primary",
    course: "all",
    dateCreated: "2024-01-01T00:00:00.000Z",
    criteria: "Зарегистрироваться и войти в систему",
    points: 5,
    isActive: true
  },
  {
    id: "profile_complete",
    title: "Заполненный профиль",
    description: "Полностью заполнен профиль пользователя",
    icon: "Award",
    color: "success",
    course: "all",
    dateCreated: "2024-01-01T00:00:00.000Z",
    criteria: "Заполнить все поля в профиле",
    points: 10,
    isActive: true
  },
  {
    id: "first_file_view",
    title: "Первое изучение",
    description: "Просмотрен первый учебный файл",
    icon: "BookOpen",
    color: "info",
    course: "all",
    dateCreated: "2024-01-01T00:00:00.000Z",
    criteria: "Открыть любой учебный материал",
    points: 5,
    isActive: true
  },
  {
    id: "course_1_expert",
    title: "Эксперт 1 курса",
    description: "Изучены все материалы 1 курса",
    icon: "Crown",
    color: "warning",
    course: "1",
    dateCreated: "2024-01-01T00:00:00.000Z",
    criteria: "Просмотреть все доступные материалы 1 курса",
    points: 25,
    isActive: true
  },
  {
    id: "course_2_expert",
    title: "Эксперт 2 курса",
    description: "Изучены все материалы 2 курса",
    icon: "Crown",
    color: "warning",
    course: "2",
    dateCreated: "2024-01-01T00:00:00.000Z",
    criteria: "Просмотреть все доступные материалы 2 курса",
    points: 25,
    isActive: true
  },
  {
    id: "dedicated_student",
    title: "Усердный студент",
    description: "Посещал портал 7 дней подряд",
    icon: "Flame",
    color: "danger",
    course: "all",
    dateCreated: "2024-01-01T00:00:00.000Z",
    criteria: "Заходить в портал каждый день в течение недели",
    points: 20,
    isActive: true
  },
  {
    id: "knowledge_seeker",
    title: "Искатель знаний",
    description: "Просмотрено 10 различных материалов",
    icon: "Target",
    color: "secondary",
    course: "all",
    dateCreated: "2024-01-01T00:00:00.000Z",
    criteria: "Открыть 10 разных учебных файлов",
    points: 15,
    isActive: true
  },
  {
    id: "quick_learner",
    title: "Быстрый ученик",
    description: "Изучил 5 материалов за один день",
    icon: "Zap",
    color: "primary",
    course: "all",
    dateCreated: "2024-01-01T00:00:00.000Z",
    criteria: "Просмотреть 5 материалов в течение одного дня",
    points: 15,
    isActive: true
  }
];

export function AchievementsInitializer() {
  useEffect(() => {
    // Добавляем небольшую задержку чтобы избежать проблем при первой загрузке
    const timer = setTimeout(() => {
      try {
        initializeAchievements();
      } catch (error) {
        console.error('Failed to initialize achievements:', error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const initializeAchievements = () => {
    try {
      const existingAchievements = localStorage.getItem('achievements');
      
      // Если достижений нет, создаем базовые
      if (!existingAchievements) {
        localStorage.setItem('achievements', JSON.stringify(DEFAULT_ACHIEVEMENTS));
        console.log('Базовые достижения инициализированы');
      } else {
        // Проверяем, есть ли новые достижения для добавления
        let stored;
        try {
          stored = JSON.parse(existingAchievements);
          if (!Array.isArray(stored)) {
            throw new Error('Invalid achievements format');
          }
        } catch (parseError) {
          console.warn('Invalid achievements data, reinitializing:', parseError);
          localStorage.setItem('achievements', JSON.stringify(DEFAULT_ACHIEVEMENTS));
          return;
        }
        
        const existingIds = stored.map((a: Achievement) => a.id).filter(Boolean);
        const newAchievements = DEFAULT_ACHIEVEMENTS.filter(
          achievement => achievement.id && !existingIds.includes(achievement.id)
        );
        
        if (newAchievements.length > 0) {
          const updated = [...stored, ...newAchievements];
          localStorage.setItem('achievements', JSON.stringify(updated));
          console.log(`Добавлено ${newAchievements.length} новых достижений`);
        }
      }
    } catch (error) {
      console.error('Error initializing achievements:', error);
      // В случае ошибки устанавливаем базовые достижения
      try {
        localStorage.setItem('achievements', JSON.stringify(DEFAULT_ACHIEVEMENTS));
      } catch (storageError) {
        console.error('Failed to set default achievements:', storageError);
      }
    }
  };

  return null; // Этот компонент не рендерит ничего
}

// Функции для автоматического присвоения достижений
export const checkAndAwardAchievements = {
  // Проверка достижения "Добро пожаловать"
  welcome: (username: string) => {
    awardAchievementIfNotExists(username, "welcome");
  },

  // Проверка достижения за просмотр файла
  firstFileView: (username: string) => {
    try {
      if (!username) return;
      
      awardAchievementIfNotExists(username, "first_file_view");
      
      // Проверяем количество просмотренных файлов
      let viewHistory;
      try {
        viewHistory = JSON.parse(localStorage.getItem('userFileViews') || '{}');
      } catch (error) {
        console.warn('Invalid userFileViews data:', error);
        viewHistory = {};
      }
      
      const userViews = Array.isArray(viewHistory[username]) ? viewHistory[username] : [];
      
      if (userViews.length >= 10) {
        awardAchievementIfNotExists(username, "knowledge_seeker");
      }
      
      // Проверяем просмотры за день
      const today = new Date().toDateString();
      const todayViews = userViews.filter((view: any) => {
        try {
          return view && view.date && new Date(view.date).toDateString() === today;
        } catch (error) {
          return false;
        }
      });
      
      if (todayViews.length >= 5) {
        awardAchievementIfNotExists(username, "quick_learner");
      }
    } catch (error) {
      console.error('Error in firstFileView achievement check:', error);
    }
  },

  // Проверка достижений за изучение курса
  courseExpert: (username: string, course: string) => {
    const achievementId = `course_${course}_expert`;
    awardAchievementIfNotExists(username, achievementId);
  }
};

const awardAchievementIfNotExists = (studentId: string, achievementId: string) => {
  try {
    if (!studentId || !achievementId) return;
    
    let studentAchievements;
    try {
      studentAchievements = JSON.parse(localStorage.getItem('studentAchievements') || '[]');
      if (!Array.isArray(studentAchievements)) {
        studentAchievements = [];
      }
    } catch (error) {
      console.warn('Invalid studentAchievements data:', error);
      studentAchievements = [];
    }
    
    // Проверяем, есть ли уже это достижение у студента
    const existingAward = studentAchievements.find(
      (sa: any) => sa && sa.studentId === studentId && sa.achievementId === achievementId
    );
    
    if (!existingAward) {
      const newAchievement = {
        studentId,
        achievementId,
        dateEarned: new Date().toISOString()
      };
      
      const updated = [...studentAchievements, newAchievement];
      localStorage.setItem('studentAchievements', JSON.stringify(updated));
      
      // Показываем уведомление
      let achievements;
      try {
        achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        if (!Array.isArray(achievements)) {
          achievements = [];
        }
      } catch (error) {
        console.warn('Invalid achievements data:', error);
        achievements = [];
      }
      
      const achievement = achievements.find((a: Achievement) => a && a.id === achievementId);
      
      if (achievement) {
        console.log(`Получено достижение: ${achievement.title}`);
        
        // Создаем событие для показа уведомления
        const timer = setTimeout(() => {
          try {
            window.dispatchEvent(new CustomEvent('achievementEarned', {
              detail: { achievement, studentId }
            }));
          } catch (error) {
            console.error('Error dispatching achievement event:', error);
          }
        }, 500); // Небольшая задержка для лучшего UX
        
        // Очищаем таймер через 5 секунд для предотвращения утечек памяти
        setTimeout(() => clearTimeout(timer), 5000);
      }
    }
  } catch (error) {
    console.error('Error awarding achievement:', error);
  }
};