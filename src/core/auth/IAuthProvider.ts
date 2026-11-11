/** Strategy for producing auth headers. Implementations are interchangeable (Liskov). */
export interface IAuthProvider {
  getHeaders(): Record<string, string>;
}
