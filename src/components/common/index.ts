/**
 * AllBook Design System — reusable UI components.
 * Built on shadcn/ui + Tailwind CSS.
 */

// Layout
export { PageContainer } from "./page-container";
export { PageHeader } from "./page-header";
export { SectionCard } from "./section-card";

// Actions
export { AppButton, appButtonVariants } from "./app-button";

// Surfaces
export {
  AppCard,
  AppCardContent,
  AppCardDescription,
  AppCardFooter,
  AppCardHeader,
  AppCardTitle,
} from "./app-card";

// Overlays
export {
  AppModal,
  AppModalContent,
  AppModalDescription,
  AppModalFooter,
  AppModalHeader,
  AppModalRoot,
  AppModalTitle,
  AppModalTrigger,
} from "./app-modal";
export { ConfirmDialog } from "./confirm-dialog";

// Data display
export { DataTable, type DataTableColumn } from "./data-table";
export { SearchBox } from "./search-box";
export { StatusBadge, type StatusBadgeStatus } from "./status-badge";
export { EmptyState } from "./empty-state";
export { Pagination } from "./pagination";

// Feedback
export { LoadingSpinner, LoadingOverlay } from "./loading-spinner";
export { AppToaster, toast } from "./app-toast";
export { Skeleton, SkeletonCard, SkeletonLoader, SkeletonTable } from "./skeleton-loader";

// Media & identity
export { AppAvatar, Avatar, AvatarFallback, AvatarImage } from "./app-avatar";
export { ImageUploadArea } from "./image-upload-area";

// Pickers
export { DatePicker } from "./date-picker";
export { TimePicker } from "./time-picker";

// Marketing layout (existing)
export { SiteFooter } from "./site-footer";
export { SiteHeader } from "./site-header";
