const { ApolloServer, gql } = require('apollo-server');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const PROTO_PATH = './playerstuff.proto';
const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
const webscraper = grpc.loadPackageDefinition(packageDefinition).webscraper;
const client = new webscraper.webscraperService('localhost:8080', grpc.credentials.createInsecure());

const typeDefs = gql`
  scalar Date

  type Player {
    rank: Int
    name: String
    school: String
    position: String
    nextgame: String
  }

  type PlayerRequest{
    rank: Int
    name: String
    school: String
    position: String
}

  type Query {
    players(rank: Int, position: String, school: String, name: String): [Player]
  }

  type Mutation {
    scrapeAndSeed(empty: Int): Int
  }
`;

const resolvers = {
  Query: {
      players: (parent, args, context, info) => {
        return new Promise((resolve) => client.GetPlayers({rank: args["rank"], position: args["position"], school: args["school"], name: args["name"]} , function (err, response){
              resolve(response.players);
          }));
      }
  },
  Mutation: {
    scrapeAndSeed: (parent, args, context, info) => {
      return new Promise((resolve) => client.ScrapeAndSeed({} , function (err, response){
        resolve(response.success);
      }));
    },
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers
});


server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
});