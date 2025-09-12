import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'

const httpLink = createHttpLink({
  uri: 'https://verified-killdeer-66.hasura.app/v1/graphql',
  headers: {
    'x-hasura-admin-secret': 'tLuBGIIJkJ43DQ8QERKOSdZ7Dc0p6DcLW4S4fdl8RpvIno0RjSYI8LG38ck68PbR',
  },
})
 
const apolloClient = new ApolloClient({ 
  link: httpLink,
  cache: new InMemoryCache(),
})
 
export default apolloClient
 