# ClinicalTrialsExplorer

An intuitive web application for exploring and managing clinical trials data. Built with Angular, this application provides a modern interface for accessing and interacting with clinical trial information.

## Features

### Trial Browsing and Search
- **Dynamic Trial List**: Browse through clinical trials with an intuitive card-based interface
- **Dual View Options**: 
  - Card View: Compact, grid-based layout for quick scanning
  - List View: Detailed, linear layout for in-depth reading
- **Responsive Design**: Seamlessly adapts to different screen sizes and devices

### Trial Information
- **Comprehensive Trial Details**: 
  - Trial ID (NCT Number)
  - Brief and Official Titles
  - Current Status
  - Trial Phase
  - Study Type
  - Condition being studied
  - Last Update Information
- **Quick Navigation**: Click on any trial to view its complete details

### Favorites Management
- **Favorite Trials**: Mark trials of interest for quick access later
- **Favorites Page**: Dedicated section to view and manage favorited trials
- **Synchronized Status**: Favorite status remains consistent across all views
- **Persistent Storage**: Favorites are saved locally for future sessions

### User Interface
- **Modern Material Design**: Clean and intuitive interface using Angular Material
- **Interactive Elements**:
  - Hover effects for better user feedback
  - Clear action buttons for favoriting and navigation
- **Consistent Layout**: Carefully aligned elements for optimal readability
- **Responsive Feedback**: Visual indicators for user actions

## Architecture

### Design Philosophy
The application follows a modular, service-oriented architecture that emphasizes:
- Separation of concerns
- Single responsibility principle
- Reactive state management
- Reusable components
- Type safety

### Core Services

#### ClinicalTrialsService
- **Purpose**: Central service for managing clinical trials data
- **Responsibilities**:
  - Fetching and caching trial data
  - Managing trial state
  - Handling trial filtering and sorting
  - Synchronizing with favorites state
- **Design Choice**: Uses RxJS BehaviorSubject for state management, enabling reactive updates across components while maintaining a single source of truth

#### FavoritesService
- **Purpose**: Manages user's favorite trials
- **Responsibilities**:
  - Adding/removing favorites
  - Persisting favorites to local storage
  - Broadcasting favorite status changes
  - Synchronizing with ClinicalTrialsService
- **Design Choice**: Implements local storage persistence to maintain user preferences across sessions while keeping the implementation decoupled from the UI

### Component Architecture

#### Shared Components

##### TrialCard Component
- **Purpose**: Reusable trial display component
- **Features**:
  - Dual view modes (card/list)
  - Encapsulated favorite toggle logic
  - Self-contained styling
- **Design Choice**: Made reusable to maintain consistency across different views while reducing code duplication

#### Feature Components

##### TrialList Component
- **Purpose**: Main trials browsing interface
- **Features**:
  - Handles trial filtering and pagination
  - Manages view mode switching
- **Design Choice**: Separates display logic from data management, delegating to services for state management

##### Favorites Component
- **Purpose**: Dedicated favorites management interface
- **Features**:
  - Reuses TrialCard component
  - Maintains synchronized state with main list
- **Design Choice**: Leverages shared components while maintaining its own state management through services

##### TrialDetails Component
- **Purpose**: Detailed trial information view
- **Features**:
  - Rich trial information display
  - Integrated favorite management
- **Design Choice**: Implements a dedicated route for detailed views while maintaining state consistency

### State Management
- **Reactive Approach**: Uses RxJS observables for state management
- **Benefits**:
  - Predictable data flow
  - Automatic UI updates
  - Efficient change detection
  - Easy testing
- **Implementation**:
  - Services expose observables for state changes
  - Components subscribe to relevant state streams
  - Changes propagate automatically through the application

### Styling Architecture
- **SCSS Organization**:
  - Component-specific styles for encapsulation
  - Shared styles for consistency
  - Responsive design mixins
- **Material Design Integration**:
  - Custom theme configuration
  - Extended component styles
  - Consistent spacing and typography

### Testing Strategy
- **Unit Tests**:
  - Service tests focus on data management and state transitions
  - Component tests verify display logic and user interactions
- **Integration Tests**:
  - End-to-end flows for critical user journeys
  - Service integration verification

## Technical Details

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.0.0.

### Key Technologies
- **Angular**: Frontend framework
- **Angular Material**: UI component library
- **RxJS**: Reactive programming library
- **TypeScript**: Programming language
- **SCSS**: Styling preprocessor

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
