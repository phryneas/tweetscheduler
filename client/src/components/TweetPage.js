import React from "react"
import { navigate } from "gatsby"
import { useQuery, useMutation } from "urql"
import gql from "graphql-tag"
import shortId from "shortid"
import DatePicker from "react-datepicker"
import { Badge, Box, Button, Input, Text } from "@chakra-ui/core"
import PrivateRoute from "./PrivateRoute"
import Layout from "./Layout"
import TweetInput from "./TweetInput"
import { getStatusColor, stripTypenames } from "../utils/helpers"
import { COLORS, STATUS } from "../utils/constants"

const tweetQuery = gql`
  query ScheduledTweetViewQuery($id: ID!) {
    scheduledTweetView(id: $id) {
      id
      scheduledTweet {
        id
        status
        scheduledAt
        tweets {
          id
          content
        }
      }
    }
  }
`

const tweetMutation = gql`
  mutation ScheduledTweetMutation($scheduledTweet: ScheduledTweetInput!) {
    updateScheduledTweet(scheduledTweet: $scheduledTweet) {
      id
      status
      scheduledAt
      updatedAt
      tweets {
        id
        content
      }
    }
  }
`

function TweetPageContainer({ id }) {
  const [queryRes] = useQuery({ query: tweetQuery, variables: { id } })
  const [mutationRes, updateScheduledTweet] = useMutation(tweetMutation)

  return (
    <TweetPage
      fetching={queryRes.fetching}
      error={queryRes.error}
      data={queryRes.data}
      updateScheduledTweet={updateScheduledTweet}
      updateSuccessful={Boolean(mutationRes.data)}
      updateError={mutationRes.error}
    />
  )
}

function TweetPage({ fetching, error, data, updateScheduledTweet, updateSuccessful, updateError }) {
  if (updateSuccessful) {
    navigate("/dashboard")
  }

  const { scheduledTweet, setScheduledTweet, addTweet, removeTweet, setTweet } = useScheduledTweet()

  React.useEffect(() => {
    if (data && data.scheduledTweetView) {
      setScheduledTweet(stripTypenames(data.scheduledTweetView.scheduledTweet))
    }
  }, [data, setScheduledTweet])

  if ((fetching || !scheduledTweet) && !error) {
    return (
      <PrivateRoute>
        <Layout>
          <p>Fetching...</p>
        </Layout>
      </PrivateRoute>
    )
  }

  if (error || updateError) {
    console.error({ queryError: error, mutationError: updateError })
    return (
      <PrivateRoute>
        <Layout>
          <p>Error...</p>
        </Layout>
      </PrivateRoute>
    )
  }

  return (
    <PrivateRoute>
      <Layout>
        <Box mx="auto" maxW={800}>
          <Badge variantColor={getStatusColor(scheduledTweet.status)}>
            {scheduledTweet.status}
          </Badge>

          {scheduledTweet.tweets.map((tweet, i) => (
            <TweetInput
              key={tweet.id}
              tweet={tweet}
              onChange={setTweet(i)}
              removeTweet={removeTweet(i)}
            />
          ))}

          <Button
            leftIcon="add"
            variant="outline"
            variantColor={COLORS.primary}
            size="sm"
            mb={8}
            display="flex"
            onClick={addTweet}
          >
            Add another tweet
          </Button>

          <DatePicker
            minDate={new Date().getTime()}
            selected={Number(scheduledTweet.scheduledAt)}
            onChange={date => {
              setScheduledTweet({ ...scheduledTweet, scheduledAt: date.getTime().toString() })
            }}
            showTimeSelect
            shouldCloseOnSelect
            timeIntervals={1}
            dateFormat="MMMM d, yyyy h:mm aa"
            customInput={<DatePickerInput />}
          />

          <Box mt={12}>
            <Button
              variantColor={COLORS.primary}
              mr={4}
              onClick={() => {
                updateScheduledTweet({
                  scheduledTweet: { ...scheduledTweet, status: STATUS.scheduled },
                })
              }}
            >
              Schedule Tweet
            </Button>
            <Button
              variant="outline"
              variantColor={COLORS.primary}
              mr={4}
              onClick={() => {
                updateScheduledTweet({
                  scheduledTweet: { ...scheduledTweet, status: STATUS.draft },
                })
              }}
            >
              Save as Draft
            </Button>
            <Button variant="ghost" variantColor={COLORS.danger} mr={4}>
              Delete
            </Button>
          </Box>
        </Box>
      </Layout>
    </PrivateRoute>
  )
}

const DatePickerInput = React.forwardRef(({ value, onClick }, ref) => {
  return (
    <Text as="label" fontWeight="bold" fontSize="lg">
      Choose post time
      <Input
        ref={ref}
        onClick={onClick}
        onFocus={onClick}
        value={value}
        readOnly
        mt={3}
        w={250}
        style={{ backgroundColor: "#fff" }} // counteract readOnly
      />
    </Text>
  )
})

function useScheduledTweet() {
  const [scheduledTweet, setScheduledTweet] = React.useState()

  function addTweet() {
    setScheduledTweet({
      ...scheduledTweet,
      tweets: [...scheduledTweet.tweets, { id: shortId.generate(), content: "" }],
    })
  }

  const removeTweet = index => () => {
    setScheduledTweet({
      ...scheduledTweet,
      tweets: scheduledTweet.tweets.filter((v, i) => i !== index),
    })
  }

  const setTweet = index => value => {
    const newTweets = [...scheduledTweet.tweets]
    newTweets[index] = { ...newTweets[index], content: value }
    setScheduledTweet({ ...scheduledTweet, tweets: newTweets })
  }

  return { scheduledTweet, setScheduledTweet, addTweet, removeTweet, setTweet }
}

export default TweetPageContainer
