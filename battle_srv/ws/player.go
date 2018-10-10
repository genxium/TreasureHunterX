package ws

import (
  "server/models"
)

func walletSync(session *Session, id int) {
  wallet, err := models.GetPlayerWalletById(id)
  if err == nil {
    wsSend(session, "WalletSync", wallet)
  }
}
