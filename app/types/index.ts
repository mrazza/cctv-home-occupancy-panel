export interface OccupancyStatus {
  is_someone_home: boolean
  current_occupancy: number
  system_state: string
  last_updated: string
  last_processed_frame: string
}

export interface CctvEvent {
  id: number
  event_type: string // e.g. 'ENTER' | 'LEAVE' | 'FORCE_RESET'
  tracker_id?: number | null
  confidence?: number | null
  timestamp: string
  snapshot_path?: string | null
}

export interface Toast {
  id: string
  message: string
  type: string // 'success' | 'error' | 'info'
}

export interface LightboxState {
  isOpen: boolean
  imageSrc: string
  title: string
  subtitle: string
}
