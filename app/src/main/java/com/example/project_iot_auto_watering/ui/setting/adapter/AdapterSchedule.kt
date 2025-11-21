package com.example.project_iot_auto_watering.ui.setting.adapter

import android.annotation.SuppressLint
import android.util.Log
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.data.model.response.ScheduleDTO
import com.example.project_iot_auto_watering.databinding.ItemScheduleWaterTreeBinding
import java.time.Instant
import java.time.ZoneId

class AdapterSchedule(private val listener: OnClickIcon): ListAdapter<ScheduleDTO, AdapterSchedule.ScheduleViewHolder>(
    ScheduleDiffCallBack()
) {
    override fun onCreateViewHolder(
        parent: ViewGroup,
        viewType: Int
    ): ScheduleViewHolder {
        val view= ItemScheduleWaterTreeBinding.inflate(LayoutInflater.from(parent.context),parent,false)
        return ScheduleViewHolder(view)
    }

    override fun onBindViewHolder(
        holder: ScheduleViewHolder,
        position: Int
    ) {
        val itemSchedule=getItem(position)
        holder.bind(itemSchedule)
    }

    inner class ScheduleViewHolder(private val binding: ItemScheduleWaterTreeBinding): RecyclerView.ViewHolder(binding.root){
        @SuppressLint("SetTextI18n")
        fun bind(scheduleDTO: ScheduleDTO){
            val time=scheduleDTO.time
            val duration=scheduleDTO.durationSeconds
            val instant = Instant.parse(scheduleDTO.date)
            val date = instant.atZone(ZoneId.systemDefault()).toLocalDate()
            val repeat=checkRepeat(scheduleDTO.repeat)
            Log.d("bind","$date|$time|$duration|$repeat")
            binding.tvItem.text="$date, $time\n${duration}s, Lặp lại: $repeat"
            binding.imgEdit.setOnClickListener {
                listener.onClickIconEdit(scheduleDTO)
            }
            binding.imgRemove.setOnClickListener {
                listener.onClickIconRemove(scheduleDTO.id)
            }
        }
    }

}
interface OnClickIcon{
    fun onClickIconEdit(scheduleDTO: ScheduleDTO)
    fun onClickIconRemove(idSchedule:Int)
}
fun checkRepeat(r:String):String{
    when(r){
        "once"->{return "Không"}
        "daily"->{return  "Hàng ngày"}
        "week:0"->{return "Mỗi thứ 2"}
        "week:1"->{return "Mỗi thứ 3"}
        "week:2"->{return "Mỗi thứ 4"}
        "week:3"->{return "Mỗi thứ 5"}
        "week:4"->{return "Mỗi thứ 6"}
        "week:5"->{return "Mỗi thứ 7"}
        "week:6"->{return "Mỗi chủ nhật"}
    }
    return "Không"
}