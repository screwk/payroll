// PAYROLL Program IDL
// Auto-generated from Anchor program

export type Payroll = {
  version: "0.1.0";
  name: "payroll";
  instructions: [
    {
      name: "initialize";
      accounts: [
        { name: "platform"; isMut: true; isSigner: false },
        { name: "admin"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "createRaffle";
      accounts: [
        { name: "platform"; isMut: true; isSigner: false },
        { name: "raffle"; isMut: true; isSigner: false },
        { name: "raffleVault"; isMut: true; isSigner: false },
        { name: "admin"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [
        { name: "raffleId"; type: "u64" },
        { name: "prizeAmount"; type: "u64" },
        { name: "ticketPrice"; type: "u64" },
        { name: "maxTickets"; type: "u32" },
        { name: "endTime"; type: "i64" },
        { name: "isFree"; type: "bool" }
      ];
    },
    {
      name: "buyTicket";
      accounts: [
        { name: "raffle"; isMut: true; isSigner: false },
        { name: "ticket"; isMut: true; isSigner: false },
        { name: "raffleVault"; isMut: true; isSigner: false },
        { name: "buyer"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [{ name: "quantity"; type: "u32" }];
    },
    {
      name: "drawWinner";
      accounts: [{ name: "raffle"; isMut: true; isSigner: false }];
      args: [];
    },
    {
      name: "setWinner";
      accounts: [
        { name: "raffle"; isMut: true; isSigner: false },
        { name: "winningTicket"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "claimPrize";
      accounts: [
        { name: "raffle"; isMut: true; isSigner: false },
        { name: "raffleVault"; isMut: true; isSigner: false },
        { name: "winner"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    },
    {
      name: "withdrawProceeds";
      accounts: [
        { name: "platform"; isMut: false; isSigner: false },
        { name: "raffle"; isMut: true; isSigner: false },
        { name: "raffleVault"; isMut: true; isSigner: false },
        { name: "admin"; isMut: true; isSigner: true },
        { name: "systemProgram"; isMut: false; isSigner: false }
      ];
      args: [];
    }
  ];
  accounts: [
    {
      name: "Platform";
      type: {
        kind: "struct";
        fields: [
          { name: "admin"; type: "publicKey" },
          { name: "totalRaffles"; type: "u64" },
          { name: "bump"; type: "u8" }
        ];
      };
    },
    {
      name: "Raffle";
      type: {
        kind: "struct";
        fields: [
          { name: "id"; type: "u64" },
          { name: "admin"; type: "publicKey" },
          { name: "prizeAmount"; type: "u64" },
          { name: "ticketPrice"; type: "u64" },
          { name: "maxTickets"; type: "u32" },
          { name: "ticketsSold"; type: "u32" },
          { name: "endTime"; type: "i64" },
          { name: "isFree"; type: "bool" },
          { name: "isDrawn"; type: "bool" },
          { name: "winningTicket"; type: "u32" },
          { name: "winner"; type: { option: "publicKey" } },
          { name: "isClaimed"; type: "bool" },
          { name: "bump"; type: "u8" },
          { name: "vaultBump"; type: "u8" }
        ];
      };
    },
    {
      name: "Ticket";
      type: {
        kind: "struct";
        fields: [
          { name: "raffle"; type: "publicKey" },
          { name: "owner"; type: "publicKey" },
          { name: "startNumber"; type: "u32" },
          { name: "quantity"; type: "u32" },
          { name: "bump"; type: "u8" }
        ];
      };
    }
  ];
  errors: [
    { code: 6000; name: "Unauthorized"; msg: "You are not authorized to perform this action" },
    { code: 6001; name: "RaffleAlreadyDrawn"; msg: "Raffle has already been drawn" },
    { code: 6002; name: "RaffleNotEnded"; msg: "Raffle has not ended yet" },
    { code: 6003; name: "RaffleEnded"; msg: "Raffle has ended" },
    { code: 6004; name: "NotEnoughTickets"; msg: "Not enough tickets available" },
    { code: 6005; name: "NoTicketsSold"; msg: "No tickets were sold" },
    { code: 6006; name: "RaffleNotDrawn"; msg: "Raffle has not been drawn yet" },
    { code: 6007; name: "WinnerAlreadySet"; msg: "Winner has already been set" },
    { code: 6008; name: "NotWinningTicket"; msg: "This ticket is not the winning ticket" },
    { code: 6009; name: "PrizeAlreadyClaimed"; msg: "Prize has already been claimed" },
    { code: 6010; name: "NotTheWinner"; msg: "You are not the winner" },
    { code: 6011; name: "PrizeNotClaimed"; msg: "Prize has not been claimed yet" },
    { code: 6012; name: "MathOverflow"; msg: "Math overflow" }
  ];
};

export const IDL: Payroll = {
  version: "0.1.0",
  name: "payroll",
  instructions: [
    {
      name: "initialize",
      accounts: [
        { name: "platform", isMut: true, isSigner: false },
        { name: "admin", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "createRaffle",
      accounts: [
        { name: "platform", isMut: true, isSigner: false },
        { name: "raffle", isMut: true, isSigner: false },
        { name: "raffleVault", isMut: true, isSigner: false },
        { name: "admin", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "raffleId", type: "u64" },
        { name: "prizeAmount", type: "u64" },
        { name: "ticketPrice", type: "u64" },
        { name: "maxTickets", type: "u32" },
        { name: "endTime", type: "i64" },
        { name: "isFree", type: "bool" },
      ],
    },
    {
      name: "buyTicket",
      accounts: [
        { name: "raffle", isMut: true, isSigner: false },
        { name: "ticket", isMut: true, isSigner: false },
        { name: "raffleVault", isMut: true, isSigner: false },
        { name: "buyer", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "quantity", type: "u32" }],
    },
    {
      name: "drawWinner",
      accounts: [{ name: "raffle", isMut: true, isSigner: false }],
      args: [],
    },
    {
      name: "setWinner",
      accounts: [
        { name: "raffle", isMut: true, isSigner: false },
        { name: "winningTicket", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "claimPrize",
      accounts: [
        { name: "raffle", isMut: true, isSigner: false },
        { name: "raffleVault", isMut: true, isSigner: false },
        { name: "winner", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
    {
      name: "withdrawProceeds",
      accounts: [
        { name: "platform", isMut: false, isSigner: false },
        { name: "raffle", isMut: true, isSigner: false },
        { name: "raffleVault", isMut: true, isSigner: false },
        { name: "admin", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Platform",
      type: {
        kind: "struct",
        fields: [
          { name: "admin", type: "publicKey" },
          { name: "totalRaffles", type: "u64" },
          { name: "bump", type: "u8" },
        ],
      },
    },
    {
      name: "Raffle",
      type: {
        kind: "struct",
        fields: [
          { name: "id", type: "u64" },
          { name: "admin", type: "publicKey" },
          { name: "prizeAmount", type: "u64" },
          { name: "ticketPrice", type: "u64" },
          { name: "maxTickets", type: "u32" },
          { name: "ticketsSold", type: "u32" },
          { name: "endTime", type: "i64" },
          { name: "isFree", type: "bool" },
          { name: "isDrawn", type: "bool" },
          { name: "winningTicket", type: "u32" },
          { name: "winner", type: { option: "publicKey" } },
          { name: "isClaimed", type: "bool" },
          { name: "bump", type: "u8" },
          { name: "vaultBump", type: "u8" },
        ],
      },
    },
    {
      name: "Ticket",
      type: {
        kind: "struct",
        fields: [
          { name: "raffle", type: "publicKey" },
          { name: "owner", type: "publicKey" },
          { name: "startNumber", type: "u32" },
          { name: "quantity", type: "u32" },
          { name: "bump", type: "u8" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "Unauthorized", msg: "You are not authorized to perform this action" },
    { code: 6001, name: "RaffleAlreadyDrawn", msg: "Raffle has already been drawn" },
    { code: 6002, name: "RaffleNotEnded", msg: "Raffle has not ended yet" },
    { code: 6003, name: "RaffleEnded", msg: "Raffle has ended" },
    { code: 6004, name: "NotEnoughTickets", msg: "Not enough tickets available" },
    { code: 6005, name: "NoTicketsSold", msg: "No tickets were sold" },
    { code: 6006, name: "RaffleNotDrawn", msg: "Raffle has not been drawn yet" },
    { code: 6007, name: "WinnerAlreadySet", msg: "Winner has already been set" },
    { code: 6008, name: "NotWinningTicket", msg: "This ticket is not the winning ticket" },
    { code: 6009, name: "PrizeAlreadyClaimed", msg: "Prize has already been claimed" },
    { code: 6010, name: "NotTheWinner", msg: "You are not the winner" },
    { code: 6011, name: "PrizeNotClaimed", msg: "Prize has not been claimed yet" },
    { code: 6012, name: "MathOverflow", msg: "Math overflow" },
  ],
};
