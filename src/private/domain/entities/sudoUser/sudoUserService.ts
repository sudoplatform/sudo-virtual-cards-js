export interface SudoUserService {
  isSignedIn(): Promise<boolean>
}
