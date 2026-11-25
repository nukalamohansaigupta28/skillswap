const swaggerJsdoc = require('swagger-jsdoc');
const env = require('./env');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Skill-Swap Platform REST API',
    version: '1.0.0',
    description:
      'Production-grade RESTful API documentation for the Skill-Swap Platform monorepo capstone project. Supports skill-exchange matchmaking, real-time Socket.io chat, session lifecycle scheduling, atomic skill-credit transfers, reviews, and admin moderation.',
    contact: {
      name: 'Skill-Swap Engineering Team',
      email: 'support@skillswap.com'
    }
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`,
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT token in format: Bearer <token>'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '651a2f18b3e5c70012345678' },
          name: { type: 'string', example: 'Alice Johnson' },
          email: { type: 'string', example: 'alice@example.com' },
          bio: { type: 'string', example: 'Guitarist wanting to learn web development' },
          location: {
            type: 'object',
            properties: {
              city: { type: 'string', example: 'Boston' },
              country: { type: 'string', example: 'USA' }
            }
          },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          status: { type: 'string', enum: ['active', 'suspended'], example: 'active' },
          creditBalance: { type: 'number', example: 2 },
          ratingAverage: { type: 'number', example: 4.9 },
          ratingCount: { type: 'number', example: 12 }
        }
      },
      Skill: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string', example: 'Acoustic Guitar' },
          category: {
            type: 'string',
            enum: ['Music', 'Cooking', 'Coding', 'Languages', 'Sports', 'Art', 'Academics', 'Other'],
            example: 'Music'
          },
          description: { type: 'string' },
          status: { type: 'string', enum: ['approved', 'pending', 'rejected'], example: 'approved' }
        }
      },
      MatchRequest: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          sender: { type: 'string' },
          receiver: { type: 'string' },
          skillRequested: { type: 'string' },
          skillOffered: { type: 'string' },
          matchType: { type: 'string', enum: ['MUTUAL', 'ONE_WAY'], example: 'MUTUAL' },
          status: { type: 'string', enum: ['pending', 'accepted', 'declined', 'cancelled'], example: 'pending' },
          message: { type: 'string' }
        }
      },
      Session: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          teacher: { type: 'string' },
          learner: { type: 'string' },
          skill: { type: 'string' },
          scheduledAt: { type: 'string', format: 'date-time' },
          durationMinutes: { type: 'integer', example: 60 },
          mode: { type: 'string', enum: ['online', 'offline'], example: 'online' },
          meetingLink: { type: 'string' },
          status: { type: 'string', enum: ['proposed', 'confirmed', 'rescheduled', 'cancelled', 'completed'] },
          creditsTransferred: { type: 'boolean', example: false }
        }
      },
      Review: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          session: { type: 'string' },
          reviewer: { type: 'string' },
          reviewee: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          comment: { type: 'string', example: 'Super patient and clear instructor!' }
        }
      },
      CreditTransaction: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          user: { type: 'string' },
          amount: { type: 'number', example: 1.0 },
          type: { type: 'string', enum: ['BONUS', 'EARN', 'SPEND', 'REFUND', 'ADMIN_ADJUST'], example: 'EARN' },
          balanceAfter: { type: 'number', example: 3.0 },
          description: { type: 'string', example: 'Earned 1 credit for teaching session' }
        }
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' }
        }
      }
    }
  },
  tags: [
    { name: 'Auth', description: 'Authentication, registration, login & tokens' },
    { name: 'Users', description: 'User profiles, photo uploads & search' },
    { name: 'Skills', description: 'Skill catalog, proposals & approvals' },
    { name: 'Matches', description: 'Ranked matching suggestions & factor breakdowns' },
    { name: 'Requests', description: 'Swap proposals lifecycle (send, accept, decline, cancel)' },
    { name: 'Sessions', description: 'Session scheduling, confirmation, reschedule & dual completion' },
    { name: 'Wallet', description: 'Credit balance & audit transaction ledger' },
    { name: 'Chat', description: 'Conversation threads & chat messages' },
    { name: 'Notifications', description: 'In-app alerts and notifications' },
    { name: 'Reviews', description: 'Post-session star ratings & feedback' },
    { name: 'Reports', description: 'User safety & misconduct reports' },
    { name: 'Admin', description: 'Platform analytics, user suspension & moderation' }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js', './src/app.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

