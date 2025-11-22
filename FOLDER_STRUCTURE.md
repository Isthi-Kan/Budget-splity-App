# 📁 Splitify Folder Structure

This document explains the improved folder structure for the Splitify React Native/Expo application.

## 🏗️ Overview

The new structure follows modern React Native best practices with a clear separation of concerns:

```
splitify/
├── src/                          # Main source code
│   ├── components/              # React components
│   │   ├── common/             # Shared/common components
│   │   ├── ui/                 # Pure UI components (buttons, inputs, etc.)
│   │   ├── forms/              # Form-specific components
│   │   └── index.ts            # Component exports
│   ├── screens/                # Screen components
│   │   ├── auth/               # Authentication screens
│   │   ├── main/               # Main app screens
│   │   └── index.ts            # Screen exports
│   ├── services/               # External service integrations
│   │   ├── firebase/           # Firebase setup and methods
│   │   ├── api/                # REST API client
│   │   └── index.ts            # Service exports
│   ├── navigation/             # Navigation configuration
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   ├── types/                  # TypeScript type definitions
│   ├── constants/              # App constants and configuration
│   └── store/                  # State management (Redux/Zustand/Context)
├── app/                        # Expo Router app directory (routing only)
├── assets/                     # Static assets (images, fonts, etc.)
├── scripts/                    # Build and utility scripts
└── config files...             # Configuration files
```

## 📂 Detailed Structure

### `src/components/`

- **`common/`** - Reusable components used across multiple screens
- **`ui/`** - Pure UI components (buttons, inputs, modals)
- **`forms/`** - Form-specific components and validation

### `src/screens/`

- **`auth/`** - Login, signup, forgot password screens
- **`main/`** - Main application screens (home, profile, etc.)

### `src/services/`

- **`firebase/`** - Firebase authentication, Firestore, storage
- **`api/`** - REST API client and endpoint definitions

### `src/navigation/`

- Navigation configuration and routing logic

### `src/hooks/`

- Custom React hooks for reusable logic

### `src/utils/`

- Pure utility functions (formatting, validation, etc.)

### `src/types/`

- TypeScript type definitions and interfaces

### `src/constants/`

- App configuration, theme colors, API endpoints

### `src/store/`

- State management setup (Redux, Zustand, or Context API)

## 🎯 Benefits

1. **Scalability** - Easy to add new features without cluttering
2. **Maintainability** - Clear separation of concerns
3. **Reusability** - Components and utilities are easily shareable
4. **Developer Experience** - Predictable file locations
5. **Team Collaboration** - Standardized structure for all developers

## 📝 Usage Examples

```typescript
// Import components
import { Button, Input } from "@/components/ui";
import { LoginForm } from "@/components/forms";

// Import services
import { authService } from "@/services/firebase";
import { apiClient } from "@/services/api";

// Import utilities
import { formatCurrency, isValidEmail } from "@/utils";

// Import types
import { User, LoginCredentials } from "@/types";
```

## 🔄 Migration Notes

- All existing files have been moved to the new structure
- Import paths need to be updated throughout the codebase
- Index files provide clean exports for each directory
- The `app/` directory now only handles routing via Expo Router

## 🚀 Next Steps

1. Update import paths in existing files
2. Configure path mapping in `tsconfig.json` for cleaner imports
3. Add more specific components as the app grows
4. Implement proper state management in the `store/` directory
