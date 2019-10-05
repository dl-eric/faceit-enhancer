/** @jsx h */
import select from 'select-dom'
import { getRoomId } from '../libs/match-room'
import { getSelf, getPlayerMatches } from '../libs/faceit'
import { hasFeatureAttribute, setFeatureAttribute } from '../libs/dom-element'
import { mapMatchesWithElo } from '../libs/matches'
import { getIsFreeMember } from '../libs/membership'

const FEATURE_ATTRIBUTE = 'elo-points'

export default async () => {
  const matchHistoryElements = select.all(
    'div[class*=ActivityList__MatchLinkHolder] > a'
  )

  if (
    matchHistoryElements.length === 0 ||
    matchHistoryElements.some(matchHistoryElement =>
      hasFeatureAttribute(FEATURE_ATTRIBUTE, matchHistoryElement)
    )
  ) {
    return
  }

  const self = await getSelf()
  const game = self.flag
  const isFreeMember = getIsFreeMember(self)

  let matches = await getPlayerMatches(self.guid, game)
  matches = mapMatchesWithElo(matches, game)

  if (!matches) {
    return
  }

  matchHistoryElements.forEach(matchHistoryElement => {
    if (hasFeatureAttribute(FEATURE_ATTRIBUTE, matchHistoryElement)) {
      return
    }
    setFeatureAttribute(FEATURE_ATTRIBUTE, matchHistoryElement)

    const matchId = getRoomId(matchHistoryElement.getAttribute('href'))

    const resultElement = select(
      'span[class*=TextLabel] > span',
      matchHistoryElement
    )

    const match = matches[matchId]

    if (!match) {
      return
    }

    const { eloDiff, eloAfter } = match

    resultElement.textContent += ` (${eloDiff >= 0 ? '+' : ''}${eloDiff}${
      isFreeMember ? '' : ` / ${eloAfter}`
    } Elo)`
  })
}
