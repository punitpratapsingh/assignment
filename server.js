const express = require('express')
const graphqlHTTP = require('express-graphql')
const graphql = require('graphql')
const joinMonster = require('join-monster')

// Connect to database
const { Client } = require('pg')
const client = new Client({
  host: "localhost",
  user: "postgres",
  password: "postgres",
  database: "league"
})
client.connect()

// Define the schema
const User = new graphql.GraphQLObjectType({
  name: 'user',
  fields: () => ({
    id: { type: graphql.GraphQLString },
    first_name: { type: graphql.GraphQLString },
    last_name: { type: graphql.GraphQLString },
    gender: { type: graphql.GraphQLString },
    team: {
      type: user_tracking,
      sqlJoin: (User, userTracking, args) => `${User}.id = ${userTracking}.id`
    }
  })
});

User._typeConfig = {
  sqlTable: 'user',
  uniqueKey: 'id',
}

var userTracking = new graphql.GraphQLObjectType({
  name: 'user_tracking',
  fields: () => ({
    user_id: { type: graphql.GraphQLInt },
    lat: { type: graphql.GraphQLInt },
    lng: { type: graphql.GraphQLInt },
    user: {
      type: graphql.GraphQLList(User),
      sqlJoin: (user, user_tracking, args) => `${user}.id = ${user_tracking}.user_id`
    }
  })
})

Team._typeConfig = {
  sqlTable: 'user',
  uniqueKey: 'id'
}


const MutationRoot = new graphql.GraphQLObjectType({
  name: 'Mutation',
  fields: () => ({
    player: {
      type: Player,
      args: {
        first_name: { type: graphql.GraphQLNonNull(graphql.GraphQLString) },
        last_name: { type: graphql.GraphQLNonNull(graphql.GraphQLString) },
        id: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) },
        gender: { type: graphql.GraphQLNonNull(graphql.GraphQLString) },
      },
      resolve: async (parent, args, context, resolveInfo) => {
        try {
          return (await client.query("INSERT INTO user (first_name, last_name, id, gender) VALUES ($1, $2, $3) RETURNING *", [args.first_name, args.last_name, args.id, args.gender])).rows[0]
        } catch (err) {
          throw new Error("Failed to insert new user")
        }
      }
    }
  })
})

const QueryRoot = new graphql.GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    hello: {
      type: graphql.GraphQLString,
      resolve: () => "Hey!"
    },
    users: {
      type: new graphql.GraphQLList(Player),
      resolve: (parent, args, context, resolveInfo) => {
        return joinMonster.default(resolveInfo, {}, sql => {
          return client.query(sql)
        })
      }
    },
    user: {
      type: Player,
      args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) } },
      where: (User, args, context) => `${User}.id = ${args.id}`,
      resolve: (parent, args, context, resolveInfo) => {
        return joinMonster.default(resolveInfo, {}, sql => {
          return client.query(sql)
        })
      }
    },
    user_trackings: {
      type: new graphql.GraphQLList(Team),
      resolve: (parent, args, context, resolveInfo) => {
        return joinMonster.default(resolveInfo, {}, sql => {
          return client.query(sql)
        })
      }
    },
    user_tracking: {
      type: Team,
      args: { id: { type: graphql.GraphQLNonNull(graphql.GraphQLInt) } },
      where: (user_tracking, args, context) => `${user_tracking}.id = ${args.id}`,
      resolve: (parent, args, context, resolveInfo) => {
        return joinMonster.default(resolveInfo, {}, sql => {
          return client.query(sql)
        })
      }
    },
  
  })
})

const schema = new graphql.GraphQLSchema({
  query: QueryRoot,
  mutation: MutationRoot
});

// Create the Express app
const app = express();
app.use('/api', graphqlHTTP({
  schema: schema,
  graphiql: true
}));
app.listen(4000);