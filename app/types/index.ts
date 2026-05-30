export type EventType = 'ENTER' | 'LEAVE' | 'FORCE_RESET'
export type ToastType = 'success' | 'error' | 'info'
export type SystemState = 'ACTIVE' | 'IDLE' | 'OFFLINE'

export interface OccupancyStatus {
  is_someone_home: boolean
  current_occupancy: number
  system_state: SystemState
  last_updated: string
  last_processed_frame: string
}

export interface CctvEvent {
  id: number
  event_type: EventType
  tracker_id?: number | null
  confidence?: number | null
  timestamp: string
  snapshot_path?: string | null
}

export interface Toast {
  id: string
  message: string
  type: ToastType
}

export interface LightboxState {
  isOpen: boolean
  imageSrc: string
  title: string
  subtitle: string
}
