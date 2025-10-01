import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Gift, CreditCard, DollarSign, FileText, Phone, AlertCircle } from 'lucide-react';

export function BenefitsSection() {
  const socialStipendInfo = {
    categories: [
      {
        title: "Сироты и дети, оставшиеся без попечения родителей",
        documents: [
          "Справка из органов опеки",
          "Документы, подтверждающие статус сироты"
        ],
        amount: "2 740 рублей"
      },
      {
        title: "Дети-инвалиды и инвалиды I-II групп",
        documents: [
          "Справка МСЭ",
          "Медицинские документы"
        ],
        amount: "2 740 рублей"
      },
      {
        title: "Малообеспеченные семьи",
        documents: [
          "Справка о доходах всех членов семьи",
          "Справка из соцзащиты о назначении государственной социальной помощи"
        ],
        amount: "2 740 рублей"
      },
      {
        title: "Студенты из многодетных семей",
        documents: [
          "Удостоверение многодетной семьи",
          "Справка о составе семьи"
        ],
        amount: "2 740 рублей"
      }
    ],
    procedure: [
      "Подать заявление в деканат",
      "Приложить необходимые документы",
      "Дождаться рассмотрения заявления (до 10 рабочих дней)",
      "Получить уведомление о назначении стипендии"
    ]
  };

  const socialCardInfo = {
    benefits: [
      "Бесплатный проезд на всех видах городского транспорта",
      "Бесплатный проезд на пригородных электричках (в учебное время)",
      "Скидки в музеях и театрах",
      "Льготы при покупке лекарств"
    ],
    documents: [
      "Паспорт гражданина РФ",
      "Справка с места учебы",
      "Фотография 3x4 см",
      "Заявление установленной формы"
    ],
    procedure: [
      "Обратиться в МФЦ или центр выдачи социальных карт",
      "Подать заявление с необходимыми документами",
      "Дождаться изготовления карты (5-10 рабочих дней)",
      "Получить карту в указанном месте"
    ],
    validity: "Карта действительна весь период обучения"
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Gift className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold">Льготы и стипендии</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Информация о социальных льготах и стипендиях для студентов
        </p>
      </div>

      <Tabs defaultValue="stipend" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stipend" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Социальная стипендия
          </TabsTrigger>
          <TabsTrigger value="transport" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Социальная карта
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stipend" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Важная информация</AlertTitle>
            <AlertDescription>
              Социальная стипендия назначается вне зависимости от успеваемости и выплачивается дополнительно к академической стипендии.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Категории получателей социальной стипендии</CardTitle>
              <CardDescription>
                Право на получение социальной стипендии имеют следующие категории студентов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {socialStipendInfo.categories.map((category, index) => (
                  <Card key={index} className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        {category.title}
                        <Badge variant="secondary">{category.amount}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="font-medium text-sm">Необходимые документы:</p>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {category.documents.map((doc, docIndex) => (
                            <li key={docIndex}>• {doc}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Порядок оформления
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {socialStipendInfo.procedure.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm">
                  <strong>Контакты для справок:</strong><br />
                  Отдел по социальной работе<br />
                  Кабинет 150, главный корпус<br />
                  Телефон: +7 (123) 456-78-95<br />
                  Email: social@meduni.ru
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transport" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Социальная карта студента</AlertTitle>
            <AlertDescription>
              Позволяет бесплатно пользоваться общественным транспортом и получать различные льготы.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  Льготы по карте
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {socialCardInfo.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs mt-1">✓</Badge>
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Необходимые документы</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {socialCardInfo.documents.map((doc, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-1 text-gray-600" />
                      <span className="text-sm">{doc}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Порядок получения</CardTitle>
              <CardDescription>
                Пошаговая инструкция по оформлению социальной карты
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {socialCardInfo.procedure.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Badge variant="default" className="text-xs">{index + 1}</Badge>
                    <p className="text-sm">{step}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm text-blue-900 dark:text-blue-100">
                      {socialCardInfo.validity}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      При переводе на следующий курс необходимо обновить справку с места учебы
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Центры выдачи социальных карт</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">МФЦ "Центральный"</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ул. Центральная, 25<br />
                    Режим работы: Пн-Пт 8:00-20:00, Сб 9:00-18:00<br />
                    Телефон: +7 (123) 456-78-96
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">МФЦ "Студенческий"</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ул. Студенческая, 10<br />
                    Режим работы: Пн-Пт 9:00-18:00<br />
                    Телефон: +7 (123) 456-78-97
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}