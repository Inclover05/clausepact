export type Agreement = {id:string;creator:string;contributor:string;title:string;requirements:string[];policy:string;agreement_hash:string;payload:string;accepted:boolean};
export type Ruling = {id:string;agreement_id:string;agreement_hash:string;request_hash:string;request:string;sender:string;policy:string;payload:string;classification:string;explanation:string;clause_ids:number[];limitations:string};
export type Action = {contract:string;from:string;method:'create_agreement'|'accept_agreement'|'request_ruling';args:string[]};
export type Pending = {action:Action;state:string;hash?:string;genHash?:string;error?:string;protocolStatus?:string;createdAt:number};
export type Quote = {transaction:{from:string;to:string;data:string;value:string;gas:string;gasPrice:string;chainId:string};maximumFee:string;expiresAt:number};
