# Backend Tests Directory

Unit and integration tests for the backend API.

## Running Tests

```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## Test Structure

```
tests/
├── unit/             # Unit tests for services, utilities
├── integration/      # API endpoint tests
└── fixtures/         # Test data and mocks
```

## Example Test

```javascript
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should login with valid credentials', async () => {
    const user = new User({
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      role: 'candidate',
    });
    await user.save();

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```
