import dotenv from 'dotenv';
dotenv.config({path: '../.env'});

import Nerv, { render, Component } from 'nervjs';
import 'mini.css';
import './index.css';
import {
  AccountHttp,
  MosaicHttp,
  MosaicService,
  Address,
  PublicAccount,
  NetworkType,
  QueryParams
} from 'nem2-sdk';
import { map, tap, mergeMap, toArray, retry, catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { parse } from 'query-string';
import { formatTx2Text } from './lib/util';

const params = parse(location.search);
const api = params.api || process.env.API || 'http://localhost:3000';
const identifier = params.publicKey || params.address || window.prompt('Input Address/PublicKey');

const accountHttp = new AccountHttp(api);
const mosaicHttp = new MosaicHttp(api);
const mosaicService = new MosaicService(accountHttp, mosaicHttp);

const AccountDataSubscription = (identifier) => {
  let publicAccountFromIdentifier;
  try {
    publicAccountFromIdentifier = PublicAccount.createFromPublicKey(identifier, NetworkType.MIJIN_TEST);
  } catch(err) {
    console.debug(err);
  }
  const address = publicAccountFromIdentifier ?
    publicAccountFromIdentifier.address :
    Address.createFromRawAddress(identifier)
  ;
  return accountHttp.getAccountInfo(address).pipe(
    retry(9),
    catchError(err => { throw new Error(err.message); }),
    mergeMap(accountInfo => {
      const publicAccount = publicAccountFromIdentifier || accountInfo;
      const mosaicObservable = accountInfo.mosaics.length > 0 ?
        mosaicService.mosaicsAmountViewFromAddress(address).pipe(
          mergeMap(_ => _),
          toArray(),
          map(_ => _.sort((a, b) => a.fullName() < b.fullName() ? -1 : 1))
        ) :
        of([])
      ;
      const observables1 = [
        of({ address, publicKey: publicAccountFromIdentifier ? publicAccountFromIdentifier.publicKey : null }),
        of(accountInfo),
        mosaicObservable
      ];
      const q = new QueryParams(100);
      const observables2 = publicAccount.publicKey !== '0000000000000000000000000000000000000000000000000000000000000000' ?
        [ accountHttp.incomingTransactions(publicAccount, q),
          accountHttp.outgoingTransactions(publicAccount, q),
          accountHttp.unconfirmedTransactions(publicAccount, q),
          accountHttp.transactions(publicAccount, q) ] :
        [ of([]),
          of([]),
          of([]),
          of([]) ]
      ;
      return forkJoin(observables1.concat(observables2));
    }),
    tap(data => console.debug('AccountDataSubscription', data)),
    map(results => {
      const [ params, account, mosaics, incomings, outgoings, unconfirmed, transactions ] = results;
      return { params, account, mosaics, incomings, outgoings, unconfirmed, transactions };
    })
  )
}

const PollingAccountInfo = (context, interval = 10000) => {
  const s1 = AccountDataSubscription(context.state.identifier);
  const s2 = [
    data => context.setState({ ...data }),
    err => console.error(err)
  ];
  s1.subscribe(...s2);
  return setInterval(() => s1.subscribe(...s2), interval);
}

const CAccount = ({ data, params }) => {
  const publicKey = params.publicKey || data.publicKey;
  const address = data.address;
  return (
    <div>
      <p>Address: <a href={`${api}/account/${address.plain()}`}>{ address.pretty() }</a></p>
      <p>PublicKey: <a href={`${api}/account/${publicKey}`}>{ publicKey }</a></p>
    </div>
  );
}

const CTransaction = ({ data }) => {
  console.log(data)
  return (
    <pre>{ formatTx2Text(data) }</pre>
  );
}

const CMosaic = ({ data }) => {
  return (
    <div>
      <a href={`${api}/mosaic/${data.fullName()}`}>{ data.fullName() }</a>
      &nbsp;<span>({ data.relativeAmount() })</span>
    </div>
  );
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      identifier: props.identifier,
      params: null,
      account: null,
      mosaics: [],
      incomings: [],
      outgoings: [],
      unconfirmed: [],
      transactions: []
    }
  }

  componentWillMount() {
    PollingAccountInfo(this, 6000);
  }

  render() {
    return (
    <div class="container">
      <div class="row">
        <div class="col-sm">
          <h4>Account</h4>
          { this.state.account && <CAccount data={this.state.account} params={this.state.params} /> }
        </div>
      </div>
      <div class="row">
        <div class="col-sm">
          <h4>Mosaics</h4>
          <ul>
          { this.state.mosaics.map(mosaicView => (
            <li><CMosaic data={mosaicView} /></li>
          )) }
          </ul>
        </div>
      </div>
      <div class="row">
        <div class="col-sm">
          <h4>Incomings</h4>
          { this.state.incomings.map((tx, idx) => (
            <CTransaction key={idx} data={tx} />
          )) }
        </div>
      </div>
      <div class="row">
        <div class="col-sm">
          <h4>Outgoings</h4>
          { this.state.outgoings.map((tx, idx) => (
            <CTransaction key={idx} data={tx} />
          )) }
        </div>
      </div>
      <div class="row">
        <div class="col-sm">
          <h4>Transactions</h4>
          { this.state.transactions.map((tx, idx) => (
            <CTransaction key={idx} data={tx} />
          )) }
        </div>
      </div>
      <div class="row">
        <div class="col-sm">
          <h4>Unconfirmed</h4>
          { this.state.unconfirmed.map((tx, idx) => (
            <CTransaction key={idx} data={tx} />
          )) }
        </div>
      </div>
    </div>
    )
  }
}

render(<App identifier={identifier} />, document.getElementById('app'));
