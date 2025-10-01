import { useEffect } from "react";
import { Button } from "./ui/button";
import { Settings, EyeOff, Edit } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { toast } from "../lib/toast";

interface AdminEditorProps {
  isActive: boolean;
  onToggle: () => void;
}

export function AdminEditor({ isActive, onToggle }: AdminEditorProps) {
  // Убираем систему карандашиков - теперь всё редактирование через профиль
  useEffect(() => {
    // Очищаем старые иконки при деактивации
    if (!isActive) {
      document.querySelectorAll('.admin-edit-icon').forEach(el => el.remove());
    }
  }, [isActive]);

  if (!isActive) {
    return (
      <div className="fixed top-4 right-4 z-[60]">
        <Button
          onClick={onToggle}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white shadow-lg"
          size="sm"
        >
          <Settings className="w-4 h-4 mr-2" />
          Быстрый доступ
        </Button>
      </div>
    );
  }

  // Если активен - показываем только информационную панель
  return (
    <>
      {/* Панель быстрого доступа */}
      <div className="fixed top-4 right-4 z-[60] flex gap-2 items-center">
        {/* Переключатель темы */}
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg flex items-center justify-center w-10 h-10">
          <ThemeToggle />
        </div>
        
        <Button
          onClick={onToggle}
          variant="outline"
          className="bg-background/95 backdrop-blur-sm border shadow-lg hover:bg-accent"
          size="sm"
        >
          <EyeOff className="w-4 h-4 mr-1" />
          Скрыть
        </Button>
      </div>

      {/* Информационная панель */}
      <div className="fixed bottom-4 right-4 z-[60] bg-card/95 backdrop-blur-sm border text-foreground text-sm p-4 rounded-lg max-w-sm shadow-lg">
        <p className="font-medium mb-2">🛠️ Админ-панель активна</p>
        <p className="text-muted-foreground mb-3">
          Для редактирования контента перейдите в раздел <strong>Профиль</strong> → <strong>Контент</strong>
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => {
              // Переходим к профилю (можно добавить навигацию)
              toast.success("Перейдите в раздел Профиль для редактирования");
            }}
            className="flex-1"
          >
            <Edit className="w-3 h-3 mr-1" />
            Профиль
          </Button>
        </div>
      </div>
    </>
  );
}