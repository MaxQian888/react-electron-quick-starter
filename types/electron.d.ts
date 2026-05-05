export {}

declare global {
  interface Window {
    electronAPI?: {
      greet: (name: string) => Promise<string>
    }
  }
}
