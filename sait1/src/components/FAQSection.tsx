import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { HelpCircle } from 'lucide-react';

export function FAQSection() {
  const faqCategories = [
    {
      category: "Поступление",
      badge: "Абитуриентам",
      questions: [
        {
          question: "Какие документы нужны для поступления?",
          answer: "Для поступления необходимы: аттестат о среднем образовании, паспорт, медицинская справка форма 086-У, 6 фотографий 3x4, заявление о приеме, документы, подтверждающие льготы (при наличии)."
        },
        {
          question: "Когда начинается приемная кампания?",
          answer: "Приемная кампания обычно начинается в июне. Подача документов - с 20 июня по 25 июля. Вступительные экзамены проводятся в августе. Точные даты уточняйте на официальном сайте университета."
        },
        {
          question: "Какие экзамены нужно сдавать?",
          answer: "Для большинства специальностей требуются: русский язык, химия, биология. Для некоторых направлений также математика или физика. Конкретный перечень зависит от выбранной специальности."
        }
      ]
    },
    {
      category: "Учеба",
      badge: "Студентам",
      questions: [
        {
          question: "Как проходит учебный процесс?",
          answer: "Учебный год делится на 2 семестра. Занятия проходят в виде лекций, семинаров и практических работ. В конце каждого семестра - экзаменационная сессия. Обязательна практика в медицинских учреждениях."
        },
        {
          question: "Можно ли перевестись с другого факультета/вуза?",
          answer: "Да, перевод возможен при наличии свободных мест и успешной сдаче академической разности. Документы на перевод подаются в деканат до начала учебного года."
        },
        {
          question: "Что делать, если пропустил занятия по болезни?",
          answer: "Необходимо предоставить справку из медучреждения в деканат в течение 3 дней после выздоровления. Пропущенные занятия нужно отработать в установленные преподавателем сроки."
        },
        {
          question: "Как получить академический отпуск?",
          answer: "Для получения академического отпуска нужно подать заявление в деканат с указанием причины. К заявлению прикладываются подтверждающие документы (медицинские справки, повестка в армию и т.д.)."
        }
      ]
    },
    {
      category: "Стипендии",
      badge: "Финансы",
      questions: [
        {
          question: "Кто имеет право на стипендию?",
          answer: "Право на академическую стипендию имеют студенты, обучающиеся на 'хорошо' и 'отлично'. Социальная стипендия назначается студентам из малообеспеченных семей, сиротам, инвалидам."
        },
        {
          question: "Когда выплачивается стипендия?",
          answer: "Стипендия выплачивается ежемесячно до 25 числа. Первая выплата обычно происходит в октябре (после первой сессии для первокурсников)."
        },
        {
          question: "Можно ли получать несколько видов стипендий одновременно?",
          answer: "Да, студент может одновременно получать академическую и социальную стипендии. Также возможно получение именных стипендий и стипендий за достижения в науке."
        }
      ]
    },
    {
      category: "Проживание",
      badge: "Общежитие",
      questions: [
        {
          question: "Как получить место в общежитии?",
          answer: "Для получения места в общежитии нужно подать заявление в студенческий отдел. Места предоставляются в первую очередь иногородним студентам, сиротам, студентам из малообеспеченных семей."
        },
        {
          question: "Сколько стоит проживание в общежитии?",
          answer: "Стоимость проживания составляет около 1500-2500 рублей в месяц в зависимости от типа комнаты. Оплата производится до 10 числа каждого месяца."
        },
        {
          question: "Какие правила проживания в общежитии?",
          answer: "В общежитии действует пропускной режим, запрещено употребление алкоголя, курение разрешено только в специально отведенных местах. Время тишины с 23:00 до 7:00."
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <HelpCircle className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Часто задаваемые вопросы</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Ответы на самые популярные вопросы студентов и абитуриентов
        </p>
      </div>

      <div className="space-y-8">
        {faqCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.category}
                <Badge variant="outline">{category.badge}</Badge>
              </CardTitle>
              <CardDescription>
                {category.questions.length} вопросов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, questionIndex) => (
                  <AccordionItem 
                    key={questionIndex} 
                    value={`${categoryIndex}-${questionIndex}`}
                  >
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 dark:text-gray-400">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Не нашли ответ на свой вопрос?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Если вы не нашли ответ на интересующий вас вопрос, обратитесь:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Учебный отдел</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Телефон: +7 (123) 456-78-90<br />
                Email: study@meduni.ru<br />
                Кабинет 205, главный корпус
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Студенческий отдел</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Телефон: +7 (123) 456-78-91<br />
                Email: students@meduni.ru<br />
                Кабинет 102, главный корпус
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}