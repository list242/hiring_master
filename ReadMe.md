# Тестовое задание "Планировщик задач"

* Каждая отдельная задача выглядит следующим образом:
  ```
  interface ITask {
    targetId: number
    action: 'init' | 'prepare' | 'work' | 'finalize' | 'cleanup'
  }
  ```

  Использовать специальные хуки `_onComplete` или `_onExecute` нельзя, они используются для диагностики и логирования.

* Есть специальный класс `Executor` (`src/Executor.ts`), который умеет исполнять одну задачу:
  ```
  Executor.executeTask(task: ITask): Promise<void>
  ```

  В решении нельзя использовать внутреннее состояние `Executor`, только `IExecutor.executeTask()`.

Надо реализовать асинхронную функцию, которая получает на вход очередь
задач `AsyncIterable<ITask>` и максимальное кол-во одновременных "потоков" `maxThreads` и возвращает промис, который будет разрезолвлен, когде все задачи
отработают.

```
async function run(executor: IExecutor, queue: AsyncIterable<ITask>, maxThreads = 0): Promise<{...}>
```
При `maxThreads == 0` ограничения на кол-во одновременных "потоков" нету.

Функция должна исполнить задачи максимально быстро, стараясь как можно больше задач исполнить параллельно. Но, есть ограничение (в нем заключается основная сложность задачи): в один момент времени `Executor` не может исполнять несколько разных задач с одним и тем же `Task.targetId`, но при этом он может исполнять много разных задач с разными `Task.targetId` параллельно.

* Например, если мы вызовем  
  ```
  executor.executeTask({ targetId: 0, action: 'init' });
  executor.executeTask({ targetId: 0, action: 'prepare' });
  ```  
  то, второй вызов кинет исключение.

* При этом  
  ```
  executor.executeTask({ targetId: 0, action: 'init' });
  executor.executeTask({ targetId: 1, action: 'prepare' });
  ```  
  или
  ```
  await executor.executeTask({ targetId: 0, action: 'init' });
  await executor.executeTask({ targetId: 0, action: 'prepare' });
  ```  
  отработают нормально.

При взятии задачи из очереди (вызов `iterator.next()` или итерация через `for ... of`) она автоматически удаляется из очереди, при этом существующие итераторы не инвалидируются. При этом надо учесть, что очередь может быть пополнена во время исполнения задач, а также, никто не гарантирует, что очередь конечна в принципе.

Критерий остановки исполнения функции `run()`: все полученные из очереди задачи выполнены и в очереди больше нету новых новых задач.

Все задачи для одного и того же `ITask.targetId` должны быть исполнены последовательно в том порядке, в котором они находятся в очереди.

## Настройка окружения:

* `Node.js version >= 12`

## Установка и подготовка

`npm install`

## Разработка решения
* Заготовка для функции `run()` лежит в `./src/run.ts`. 
* Никакие другие файлы, кроме `./src/run.ts` менять нельзя. 
* Обвязочный код в `run.ts` менять нельзя
* Внутри одного вызова `run()` создавать дополнительные эксземпляры `Executor` нельзя.

## Самостоятельная проверка правильности решения

Для удобства я написал тесты для `run()`, которые проверяют правильность её работы.

`npm run test`

Также тесты генерят детальные отчеты-логи `./test/*.log.html`.

Если при выполнении тестов они зависают в таком состоянии, как ниже на скриншоте, то вероятно вы написали очень неоптимальный алгоритм, который вычитывает слишком много task-ов наперед (больше, чем это необходимо в моменте).
В системе тестов срабатывает защита от таких решений.

<img width="369" alt="Code_O2bY8fy5hD" src="https://github.com/user-attachments/assets/50278778-01fc-40df-aeda-884de73e7577">


У коректного решения `npm run test` дает следующий вывод:

<img width="440" alt="Code_RLL5YHVeFu" src="https://github.com/user-attachments/assets/76743e2a-5fdb-4d19-8d3e-0a0a8f01c6b8">


## 📊 Результаты тестирования и процесс разработки

**Первая итерация (3 небольших ошибки, которые были быстро исправлены):**

![Test Results Iteration 1](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/102599903/3e8a3c48-e650-44d7-b6ad-09db21aef224/image.jpg?AWSAccessKeyId=ASIA2F3EMEYE32T7ME5Y&Signature=qR8T4jLHvVgFxhlZXLXtDnTy44Y%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEJj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQCNNucZKi6KYDtmMK1ra55Y6fdTHZDPVLrLoVJjMoMjFQIhAICBJVVUgdysz2%2FuYZ9bjs1TQxW9QBmO3yk8Q0%2BEPx%2F7KvMECFEQARoMNjk5NzUzMzA5NzA1IgwudhkpO2vmuSzpsTAq0AT7nHX7JObIbjajFCRTOcwUQxrQ5Nq%2BzNDod556AapFLv6i7PB%2FM2XwFDOPJfU%2BmpRR%2BuODQLupc0VY8D2TiMw0R2Ev1CHL4SUWcfLA8ANP0oMZyfenX1JqlqV75InJIum1QnlcxDdZXsCaC5jU1%2Blf0qm%2FO0enmEC5MjiuKaE7MonTFJsCwuTHRT0xkN7lz968xpsTP3n9NBCx9LQ7wlepL8b6tVRmu0CmikG8UgIDc0%2Fx%2FmzRDaPEVlzLjkTrDeOakfyRD3XGuXXBGgmLzaCRJR6i1tvQ5Re1zQelJOa8Z7QnHb31oETkl9xr6CRvNu842AxqoxkSApHY9wmiXDZWYnKOueeGve%2FdCchkZnXPt%2FX3wp9AoQrNra31D5Q6VKlaEYpRypbbjVXauKhAvUFJ9JQFxa8xcz2b04fra50A38vqgYQALlW7dtu0Uud7opiQBii0axcrKE3Kg3p5SK%2FgbRv%2BL9M5HetCn714bsJcQl%2B1d%2BavwIrDE%2Bp2z8oK2RiuT%2FZwQ8fywwRuLCNGyCS6BrU54fonuTDkk3VYoHx83wzOvBFhzxaX2ZLsByeJiqW8SEoE1GyKojSkeull4hwl4ekvUjEF7U1fxKoNKHaUrQZ23GCHOzKujqCXx222%2BLptk7m3tGBshAN%2BA90y4TE%2FfMgOhD%2FowUkFeJuxtjRFVBXLlUMUhMQxpHBZaAomRY7QNI3h1hZPave4eEHkZCj00hylhD4TS8eWXjM7gShiVwauKdvh5xIxKTGE9A7JoO5qXSgGeNb07iJwLzKBT5f5MOL86scGOpcB89TGmvGQGAwhMyyW3w84pVbVNMIr7iuxm98Uyd5qVp34ytdBbpcl7qPjlZfUspb3C2gICoWWnBUB9QrjD7TQS5WSJqvSHI8EDonMx86Bpegb8Ly83y6QbGBttHCzHDAK%2FoO%2BJz0iQivA2514N6PMdBGFcHAN0Id46YW3MYwEsARTqMN4V784luVGZss4Vtavlj6lEeZ8cw%3D%3D&Expires=1761265965)

> **Результаты первой итерации:**
> - 30 тестов пройдено ✅
> - 5 тестов с замечаниями по производительности (исправлены в финальной версии)

### 💬 Отзыв от HR

> **Матвей, вот теперь всё отлично!**
> 
> Вижу, что вы успешно выполнили тестовое задание.
> 
> *Anastasia Korneva*
