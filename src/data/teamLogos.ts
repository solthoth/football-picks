import logo49ers from '../assets/team-logos/49ers.svg'
import logoBears from '../assets/team-logos/bears.svg'
import logoBengals from '../assets/team-logos/bengals.svg'
import logoBills from '../assets/team-logos/bills.svg'
import logoBroncos from '../assets/team-logos/broncos.svg'
import logoBrowns from '../assets/team-logos/browns.svg'
import logoBuccaneers from '../assets/team-logos/buccaneers.svg'
import logoCardinals from '../assets/team-logos/cardinals.svg'
import logoChargers from '../assets/team-logos/chargers.svg'
import logoChiefs from '../assets/team-logos/chiefs.svg'
import logoColts from '../assets/team-logos/colts.svg'
import logoCommanders from '../assets/team-logos/commanders.svg'
import logoCowboys from '../assets/team-logos/cowboys.svg'
import logoDolphins from '../assets/team-logos/dolphins.svg'
import logoEagles from '../assets/team-logos/eagles.svg'
import logoFalcons from '../assets/team-logos/falcons.svg'
import logoGiants from '../assets/team-logos/giants.svg'
import logoJaguars from '../assets/team-logos/jaguars.svg'
import logoJets from '../assets/team-logos/jets.svg'
import logoLions from '../assets/team-logos/lions.svg'
import logoPackers from '../assets/team-logos/packers.svg'
import logoPanthers from '../assets/team-logos/panthers.svg'
import logoPatriots from '../assets/team-logos/patriots.svg'
import logoRaiders from '../assets/team-logos/raiders.svg'
import logoRams from '../assets/team-logos/rams.svg'
import logoRavens from '../assets/team-logos/ravens.svg'
import logoSaints from '../assets/team-logos/saints.svg'
import logoSeahawks from '../assets/team-logos/seahawks.svg'
import logoSteelers from '../assets/team-logos/steelers.svg'
import logoTexans from '../assets/team-logos/texans.svg'
import logoTitans from '../assets/team-logos/titans.svg'
import logoVikings from '../assets/team-logos/vikings.svg'

// Keyed by the team nickname exactly as it appears in data/*.yaml (Game.away/Game.home, Participant.picks).
export const teamLogos: Record<string, string> = {
  '49ers': logo49ers,
  Bears: logoBears,
  Bengals: logoBengals,
  Bills: logoBills,
  Broncos: logoBroncos,
  Browns: logoBrowns,
  Buccaneers: logoBuccaneers,
  Cardinals: logoCardinals,
  Chargers: logoChargers,
  Chiefs: logoChiefs,
  Colts: logoColts,
  Commanders: logoCommanders,
  Cowboys: logoCowboys,
  Dolphins: logoDolphins,
  Eagles: logoEagles,
  Falcons: logoFalcons,
  Giants: logoGiants,
  Jaguars: logoJaguars,
  Jets: logoJets,
  Lions: logoLions,
  Packers: logoPackers,
  Panthers: logoPanthers,
  Patriots: logoPatriots,
  Raiders: logoRaiders,
  Rams: logoRams,
  Ravens: logoRavens,
  Saints: logoSaints,
  Seahawks: logoSeahawks,
  Steelers: logoSteelers,
  Texans: logoTexans,
  Titans: logoTitans,
  Vikings: logoVikings,
}

export function getTeamLogo(team: string | undefined | null): string | undefined {
  if (!team) return undefined
  return teamLogos[team]
}
