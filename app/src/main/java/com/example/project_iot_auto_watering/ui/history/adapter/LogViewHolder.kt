package com.example.project_iot_auto_watering.ui.history.adapter

import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.data.model.response.IrrigationLog
import com.example.project_iot_auto_watering.databinding.ItemHistoryBinding

class LogViewHolder(val binding: ItemHistoryBinding): RecyclerView.ViewHolder(binding.root) {
    fun bind(irrigationLog: IrrigationLog){
        binding.tvDate.text="Thời gian: ${irrigationLog.irrigationTime}"
        binding.tvDuration.text="Thời gian tưới: ${irrigationLog.duration}"
        binding.tvStatus.text="Trạng thái: ${irrigationLog.status}"
        binding.tvType.text="Chế độ tưới: ${irrigationLog.type}"
        binding.tvType.text="Ghi chú: ${irrigationLog.notes}"
    }
}