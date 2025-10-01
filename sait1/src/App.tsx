import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { SupabaseProvider } from "./components/SupabaseProvider";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";
import { AuthForm } from "./components/AuthForm";

import { Header } from "./components/Header";
import { MainPage } from "./components/MainPage";
import { CampusesSection } from "./components/CampusesSection";
import { FAQSection } from "./components/FAQSection";
import { BenefitsSection } from "./components/BenefitsSection";
import { JournalSection } from "./components/JournalSection";
import { UserCourseSection } from "./components/UserCourseSection";
import { ProfileSection } from "./components/ProfileSection";
import { userActivityTracker } from "./lib/userActivityTracker";

import { FileViewerPage } from "./components/FileViewerPage";
import { AdminEditor } from "./components/AdminEditor";
import { AppToaster } from "./components/Toaster";
import { AchievementsInitializer } from "./components/AchievementsInitializer";
import { AchievementNotificationManager } from "./components/AchievementNotification";
import { NotificationDemo } from "./components/NotificationDemo";
import { initializeBasicAchievements } from "./components/SimpleAchievementsInit";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Lock, LogIn, UserPlus } from "lucide-react";

function AppContent() {
  const [currentSection, setCurrentSection] = useState("main");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [viewingFile, setViewingFile] = useState<any>(null);
  const [adminEditorActive, setAdminEditorActive] = useState(false);
  const { user, logout } = useAuth();

  // Инициализируем базовые достижения при запуске
  useEffect(() => {
    const initAchievements = async () => {
      try {
        initializeBasicAchievements();
      } catch (error) {
        console.warn('Failed to initialize achievements:', error);
      }
    };
    
    initAchievements();
  }, []);

  // Track section changes
  useEffect(() => {
    if (user) {
      userActivityTracker.trackPageVisit(currentSection);
    }
  }, [currentSection, user]);

  // Глобальное состояние режима редактирования
  useEffect(() => {
    if (adminEditorActive) {
      document.body.classList.add('admin-edit-mode');
    } else {
      document.body.classList.remove('admin-edit-mode');
    }
    
    return () => {
      document.body.classList.remove('admin-edit-mode');
    };
  }, [adminEditorActive]);

  const renderSection = () => {
    if (viewingFile) {
      return (
        <FileViewerPage 
          file={viewingFile} 
          onBack={() => setViewingFile(null)}
        />
      );
    }

    // Специальные формы авторизации
    if (!user && showRegister) {
      return <RegisterForm onBack={() => setShowRegister(false)} />;
    }
    if (!user && showLogin) {
      return <LoginForm onBack={() => setShowLogin(false)} />;
    }


    // Основная логика переключения разделов (работает для всех пользователей)
    switch (currentSection) {
      case "main":
        return user ? 
          <MainPage onSectionChange={setCurrentSection} /> :
          <MainPage 
            onLogin={() => setShowLogin(true)}
            onRegister={() => setShowRegister(true)}
            onSectionChange={setCurrentSection}
          />;
      case "campuses":
        return <CampusesSection />;
      case "faq":
        return <FAQSection />;
      case "benefits":
        return <BenefitsSection />;
      case "journal":
        return user ? <JournalSection /> : <AuthRequiredMessage onLogin={() => setShowLogin(true)} onRegister={() => setShowRegister(true)} sectionName="Журнал оценок" />;
      case "course":
        return user && user.role === 'student' ? <UserCourseSection onViewFile={setViewingFile} /> : <AuthRequiredMessage onLogin={() => setShowLogin(true)} onRegister={() => setShowRegister(true)} sectionName="Материалы курса" />;



      case "profile":
        return user ? <ProfileSection /> : <AuthRequiredMessage onLogin={() => setShowLogin(true)} onRegister={() => setShowRegister(true)} sectionName="Профиль" />;
      default:
        return user ? 
          <MainPage onSectionChange={setCurrentSection} /> :
          <MainPage 
            onLogin={() => setShowLogin(true)}
            onRegister={() => setShowRegister(true)}
            onSectionChange={setCurrentSection}
          />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Инициализируем достижения только для авторизованных пользователей */}
      {user && <AchievementsInitializer />}
      
      {/* Демонстрационные уведомления */}
      <NotificationDemo />
      
      {!viewingFile && (
        <Header 
          currentSection={currentSection} 
          onSectionChange={setCurrentSection}
          user={user}
          onLogout={logout}
        />
      )}
      <main className={!viewingFile ? "container mx-auto px-4 py-8 max-w-7xl" : ""}>
        {renderSection()}
      </main>
      
      {/* Глобальная админская панель для всех страниц */}
      {user?.role === 'admin' && (
        <AdminEditor 
          isActive={adminEditorActive}
          onToggle={() => setAdminEditorActive(!adminEditorActive)}
        />
      )}
      
      <AppToaster />
      {/* Показываем уведомления о достижениях только студентам */}
      {user?.role === 'student' && <AchievementNotificationManager />}
    </div>
  );
}

// Компонент для отображения сообщения о необходимости авторизации
function AuthRequiredMessage({ onLogin, onRegister, sectionName }: {
  onLogin: () => void;
  onRegister: () => void;
  sectionName: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Lock className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>
          <CardTitle>Вход в систему требуется</CardTitle>
          <CardDescription>
            Для доступа к разделу "{sectionName}" необходимо войти в систему
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Войдите в свой аккаунт или зарегистрируйтесь, чтобы получить доступ ко всем функциям портала
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={onLogin} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Войти в систему
            </Button>
            <Button variant="outline" onClick={onRegister} className="w-full">
              <UserPlus className="mr-2 h-4 w-4" />
              Создать аккаунт
            </Button>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SupabaseProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SupabaseProvider>
    </ErrorBoundary>
  );
}