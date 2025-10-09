# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Environment Setup
```bash
# Switch to correct branch
git checkout meteor_update

# Use correct Node version
nvm use

# Install dependencies
meteor npm i --legacy-peer-deps

# Apply patches
npx patch-package

# Set environment variables and start
export MGP_SETTINGS='{"ImagePath":"/PATH_TO/data/images","PdfPath":"/PATH_TO/data/pdf","AvatarsPath":"/PATH_TO/data/avatars"}' meteor
```

### Development
```bash
# Start development server
meteor run
# or
npm start

# Run tests
meteor test --once --driver-package meteortesting:mocha
# or
npm test

# Run full-app tests with watch mode
TEST_WATCH=1 meteor test --full-app --driver-package meteortesting:mocha
# or
npm run test-app

# Bundle analyzer
meteor --production --extra-packages bundle-visualizer
# or
npm run visualize
```

## Architecture Overview

GutachtenPlus is a **Meteor.js application** for creating collaborative expert reports/assessments. Built with React 18, Ant Design, and MongoDB.

### Key Application Structure

**Entry Points:**
- `client/main.jsx` - React app initialization
- `server/main.js` - Server startup and configuration

**Data Layer (`imports/api/`):**
- `collections/` - MongoDB collections (opinions, opinionDetails, activities, users, etc.)
- `methods/` - Server-side RPC methods
- `sharedSchemas/` - Validation schemas

**UI Layer (`imports/ui/`):**
- `App.jsx` - Root component with routing
- `SiteLayout.jsx` - Main layout with navigation
- `ListOpinionDetails/` - Rich content editing components
- `components/` - Reusable UI components
- `modals/` - Modal dialogs

**Core Collections:**
- **Opinions** - Main expert reports with metadata and participants
- **OpinionDetails** - Hierarchical content structure with drag-and-drop ordering
- **Activities** - User interaction logs for collaboration
- **UserActivities** - User notifications and mentions
- **Images** - File attachments and image management

### Routing System

The app uses **dual routing** (being migrated):
- **React Router** (modern, preferred)
- **FlowRouter** (legacy, being phased out)

Key routes: `/`, `/opinions`, `/opinions/:id`, `/opinions/:id/:refDetail`, `/profile`, `/usersAdmin`

### Content Management

**Detail Types** (content components):
- Text, Heading, Question, Answer
- Picture, PictureContainer (with image annotation)
- Pagebreak, Bestimmungen (regulations)
- ClassifiedOutput (structured data)

### Key Features

- **Collaborative editing** with real-time updates
- **Rich content support** including image annotation (markerjs2)
- **PDF generation** for reports
- **Template system** for reusable report structures
- **Variable substitution** system
- **Role-based permissions**
- **Activity tracking** and notifications

### Development Patterns

1. **Reactive Data Flow** - Use Meteor's reactivity system
2. **Component-Based Architecture** - Modular React components
3. **Schema-First Design** - Comprehensive validation with SimpleSchema
4. **Permission-Based Security** - Check user permissions in methods and publications
5. **Collaborative Features** - Real-time multi-user editing support

### Important Configuration

- **Environment Variables**: Set `MGP_SETTINGS` with image/PDF paths
- **Patches**: Apply patches with `npx patch-package` after npm install
- **Legacy Dependencies**: Use `--legacy-peer-deps` for npm install
- **Node Version**: Use nvm to ensure correct Node version

### Development Notes

- Always work on the `meteor_update` branch
- The application is in German and serves the German market
- Focus on collaborative features and real-time updates
- Maintain backwards compatibility during routing system migration
- Consider security implications when working with user-generated content