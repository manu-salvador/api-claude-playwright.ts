import { Endpoints } from '../constants/Endpoints';
import { Todo, TodoPayload } from '../models';
import { BaseResourceService } from './BaseResourceService';

export class TodosService extends BaseResourceService<Todo, TodoPayload> {
  protected readonly endpoint = Endpoints.TODOS;
}
